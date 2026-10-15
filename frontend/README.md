# zkDAPP Survey Frontend

Mobile frontend for a decentralized survey/voting system, built with Expo + React Native.

The app uses:
- Ethereum Sepolia smart contract for survey creation, registration (eligibility proof verification) and ERC-1155 eligibility tokens
- Pinata/Lighthouse IPFS for survey metadata
- Census3 for building the census from ERC-1155 token holders
- Vocdoni SDK for elections and voting
- mopro for on-device Groth16 proof generation
- a relayer that submits registrations on behalf of voters

## Tech Stack

- Expo SDK 54
- React 19 + React Native 0.81
- Expo Router
- TypeScript
- Circom + Groth16 (eligibility circuit)
- Solidity (survey contract)

## Prerequisites

- Node.js 20 LTS, npm 10+
- Android Studio with Android SDK and NDK, JDK 21
- Android emulator or physical device
- [Valera wallet](../wallet) on the same device
- [Census3 fork](../census3) running locally
- Pinata JWT (or Lighthouse API key)
- Sepolia ETH for the relayer and the survey creator's wallet

## Quick Setup

### 1. Install dependencies

```bash
npm ci
```

> Use `npm ci` (not `npm install`) to install exactly from the lockfile.

### 2. Configure Android SDK path

Create `android/local.properties`:

```properties
sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your IPFS credentials. The RPC endpoint must serve the full log history from the deployment block.

### 4. Run Census3

Run our [Census3 fork](../census3) (upstream Census3 lacks the ERC-1155 support the app needs), then check it:

```bash
curl http://localhost:7788/api/info
```

### 5. Run the relayer

```bash
npm run relayer -- --keygen   # prints a key: put it into relayer/.env and fund the address with Sepolia ETH
npm run relayer
```

### 6. Run the app

```bash
npm run reverse   # forwards Metro, Census3 and the relayer to the connected device
npm run android
```

> Open the app from its icon. Expo Go does not work, because the app uses native modules (mopro, react-native-fs).

## Useful Scripts

- `npm run android` - build and run on Android emulator/device
- `npm run reverse` - forward local services to connected Android devices
- `npm run relayer` - start the registration relayer
- `npm run proof:service` - start the Node proof service (alternative to on-device proving)
- `npm run assets` - re-link assets (zkey files) to Android without a full rebuild
- `npm run lint` - run lint checks

## Project Structure

```text
app/                        screens (Expo Router)
components/                 UI components
config/                     contract, IPFS and Vocdoni configuration
contracts/                  survey contract and Groth16 verifier
services/                   contract and Vocdoni services
utils/                      ZK prover, credential parsing, Vocdoni wallets
relayer/                    registration relayer
MoproReactNativeBindings/   mopro native bindings (prebuilt)
zk/                         circuit, build artifacts and proof scripts
```
