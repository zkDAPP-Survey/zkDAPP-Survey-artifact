// Registration relayer: submits registerForElection for voters, so per-survey voter wallets never need ETH and
// no funding transaction links them to the user. It can only delay or censor registrations, not forge them:
// the contract mints to the voter address bound inside the zk proof, whoever sends the transaction.
//
//   npm run relayer            (reads relayer/.env)
//   npm run relayer -- --keygen  prints a fresh relayer key to put into relayer/.env
const fs = require('fs');
const http = require('http');
const path = require('path');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Wallet } = require('@ethersproject/wallet');
const { keccak256 } = require('@ethersproject/keccak256');
const { toUtf8Bytes } = require('@ethersproject/strings');
const { formatEther } = require('@ethersproject/units');

if (process.argv.includes('--keygen')) {
  const wallet = Wallet.createRandom();
  console.log(`RELAYER_PRIVATE_KEY=${wallet.privateKey}\n# address: ${wallet.address} (fund it with Sepolia ETH)`);
  process.exit(0);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')]),
  );
}

const relayerDir = path.dirname(path.resolve(process.argv[1]));
const appEnv = loadEnv(path.join(relayerDir, '..', '.env'));
const env = { ...appEnv, ...loadEnv(path.join(relayerDir, '.env')), ...process.env };
const PORT = Number(env.RELAYER_PORT || 8790);
const RPC_URL = env.RELAYER_RPC_URL || env.EXPO_PUBLIC_SURVEY_MANAGER_RPC_URL || 'https://sepolia.gateway.tenderly.co';
const CONTRACT = (env.RELAYER_CONTRACT_ADDRESS || env.EXPO_PUBLIC_SURVEY_MANAGER_ADDRESS || '').toLowerCase();
if (!env.RELAYER_PRIVATE_KEY || !CONTRACT) {
  console.error('Set RELAYER_PRIVATE_KEY in relayer/.env (npm run relayer -- --keygen) and EXPO_PUBLIC_SURVEY_MANAGER_ADDRESS in .env');
  process.exit(1);
}

const provider = new JsonRpcProvider(RPC_URL);
const relayer = new Wallet(env.RELAYER_PRIVATE_KEY, provider);
// Only this function may be relayed; anything else would let callers spend the relayer's ETH
const REGISTER_SELECTOR = keccak256(
  toUtf8Bytes('registerForElection(uint256,uint256[2],uint256[2][2],uint256[2],uint256[22])'),
).slice(0, 10);
const REGISTER_CALLDATA_LENGTH = 2 + 2 * (4 + 32 * (1 + 2 + 4 + 2 + 22));

// Serialize submissions so concurrent requests cannot reuse a nonce
let queue = Promise.resolve();
const serialized = (task) => (queue = queue.then(task, task));

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 10_000) reject(new Error('Request too large.'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

function revertReason(error) {
  const texts = [];
  for (let e = error, depth = 0; e && depth < 4; e = e.error, depth += 1) texts.push(e.reason, e.message, e.body);
  for (const text of texts) {
    // geth/Sepolia: "execution reverted: X"; Hardhat: "reverted with reason string 'X'"
    const match = typeof text === 'string' &&
      (text.match(/execution reverted:\s*([^"\\]+)/i) || text.match(/reverted with reason string '([^']+)'/i));
    if (match) return match[1].trim();
  }
  return (error instanceof Error ? error.message : String(error)).slice(0, 200);
}

async function relayRegistration(data) {
  if (typeof data !== 'string' || !/^0x[0-9a-fA-F]+$/.test(data)) throw new Error('Calldata must be a hex string.');
  if (data.slice(0, 10).toLowerCase() !== REGISTER_SELECTOR) throw new Error('Only registerForElection can be relayed.');
  if (data.length !== REGISTER_CALLDATA_LENGTH) throw new Error('Unexpected registerForElection calldata length.');

  return serialized(async () => {
    let gasLimit;
    try {
      // Simulates the call: an invalid proof, used nullifier or wrong survey fails here without spending gas
      gasLimit = (await relayer.estimateGas({ to: CONTRACT, data })).mul(12).div(10);
    } catch (error) {
      throw new Error(`The contract rejected the registration: ${revertReason(error)}`);
    }
    const tx = await relayer.sendTransaction({ to: CONTRACT, data, gasLimit });
    const receipt = await tx.wait();
    console.log(`[relayer] registered in block ${receipt.blockNumber}, gasUsed ${receipt.gasUsed}, tx ${tx.hash}`);
    return { txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method === 'GET' && req.url === '/relay/info') {
    const balance = await provider.getBalance(relayer.address);
    return sendJson(res, 200, { ok: true, relayer: relayer.address, balanceEth: formatEther(balance), contract: CONTRACT });
  }
  if (req.method === 'POST' && req.url === '/relay/register') {
    try {
      const { data } = await readBody(req);
      return sendJson(res, 200, { ok: true, ...(await relayRegistration(data)) });
    } catch (error) {
      console.warn(`[relayer] rejected: ${error instanceof Error ? error.message : error}`);
      return sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return sendJson(res, 404, { ok: false, error: 'Not found.' });
});

server.listen(PORT, async () => {
  const balance = await provider.getBalance(relayer.address).catch(() => null);
  console.log(`Relayer for ${CONTRACT} on http://localhost:${PORT}`);
  console.log(`Relayer wallet ${relayer.address}, balance ${balance ? formatEther(balance) : '?'} ETH`);
});
