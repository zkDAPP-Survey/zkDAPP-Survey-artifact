package web3

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/vocdoni/census3/helpers/web3"
	"github.com/vocdoni/census3/scanner/providers"
	"go.vocdoni.io/dvote/log"
)

const erc1155ABI = `[
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferSingle","type":"event"},
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event"},
	{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"uri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
]`

var parsedERC1155ABI = mustParseABI(erc1155ABI)

type ERC1155HolderProvider struct {
	endpoints *web3.Web3Pool
	client    *web3.Client

	contract         *bind.BoundContract
	address          common.Address
	chainID          uint64
	creationBlock    uint64
	lastNetworkBlock uint64
	synced           atomic.Bool
}

func mustParseABI(rawABI string) abi.ABI {
	parsed, err := abi.JSON(strings.NewReader(rawABI))
	if err != nil {
		panic(err)
	}
	return parsed
}

func (p *ERC1155HolderProvider) Init(_ context.Context, iconf any) error {
	conf, ok := iconf.(Web3ProviderConfig)
	if !ok {
		return errors.New("invalid config type, it must be Web3ProviderConfig")
	}
	p.endpoints = conf.Endpoints
	p.synced.Store(false)
	if conf.HexAddress != "" && conf.ChainID > 0 {
		return p.SetRef(Web3ProviderRef{
			HexAddress: conf.HexAddress,
			ChainID:    conf.ChainID,
		})
	}
	return nil
}

func (p *ERC1155HolderProvider) SetRef(iref any) error {
	if p.endpoints == nil {
		return errors.New("endpoints not defined")
	}
	ref, ok := iref.(Web3ProviderRef)
	if !ok {
		return errors.New("invalid ref type, it must be Web3ProviderRef")
	}
	var err error
	p.client, err = p.endpoints.Client(ref.ChainID)
	if err != nil {
		return fmt.Errorf("error getting web3 client for the given chainID: %w", err)
	}
	p.address = common.HexToAddress(ref.HexAddress)
	p.contract = bind.NewBoundContract(p.address, parsedERC1155ABI, p.client, p.client, p.client)
	p.creationBlock = 0
	if ref.CreationBlock > 0 {
		p.creationBlock = ref.CreationBlock
	}
	p.chainID = ref.ChainID
	p.lastNetworkBlock = 0
	p.synced.Store(false)
	return nil
}

func (p *ERC1155HolderProvider) SetLastBalances(_ context.Context, _ []byte,
	_ map[common.Address]*big.Int, _ uint64,
) error {
	return nil
}

func (p *ERC1155HolderProvider) SetLastBlockNumber(blockNumber uint64) {
	p.lastNetworkBlock = blockNumber
}

func (p *ERC1155HolderProvider) HoldersBalances(ctx context.Context, externalID []byte, fromBlock uint64) (
	map[common.Address]*big.Int, uint64, uint64, bool, *big.Int, error,
) {
	tokenID, err := parseERC1155TokenID(externalID)
	if err != nil {
		return nil, 0, fromBlock, false, big.NewInt(0), err
	}
	if fromBlock >= p.lastNetworkBlock && fromBlock == p.creationBlock {
		return nil, 0, fromBlock, false, big.NewInt(0),
			errors.New("outdated last network block, it will retry in the next iteration")
	}
	toBlock := p.lastNetworkBlock
	if toBlock == 0 {
		toBlock, err = p.LatestBlockNumber(ctx, externalID)
		if err != nil {
			return nil, 0, fromBlock, false, big.NewInt(0), err
		}
	}
	log.Infow("scan iteration",
		"address", p.address,
		"type", p.TypeName(),
		"externalID", tokenID.String(),
		"from", fromBlock,
		"to", toBlock)
	startTime := time.Now()
	logs, lastBlock, synced, err := RangeOfLogs(ctx, p.client, p.address, fromBlock, toBlock,
		LOG_TOPIC_ERC1155_TRANSFER_SINGLE, LOG_TOPIC_ERC1155_TRANSFER_BATCH)
	if err != nil && !errors.Is(err, ErrTooManyRequests) {
		return nil, 0, fromBlock, false, big.NewInt(0), err
	}
	if errors.Is(err, ErrTooManyRequests) {
		log.Warnf("too many requests, the provider will continue in the next iteration from block %d", lastBlock)
	}
	balances := make(map[common.Address]*big.Int)
	for _, currentLog := range logs {
		if err := p.applyTransferLog(balances, currentLog, tokenID); err != nil {
			return nil, uint64(len(logs)), lastBlock, false, big.NewInt(0),
				errors.Join(ErrParsingTokenLogs, fmt.Errorf("[ERC1155] %s: %w", p.address, err))
		}
	}
	log.Infow("saving blocks",
		"count", len(balances),
		"logs", len(logs),
		"blocks/s", 1000*float32(lastBlock-fromBlock)/float32(time.Since(startTime).Milliseconds()),
		"took", time.Since(startTime).Seconds(),
		"progress", fmt.Sprintf("%d%%", (fromBlock*100)/toBlock))
	p.synced.Store(synced)
	return balances, uint64(len(logs)), lastBlock, synced, nil, nil
}

func (p *ERC1155HolderProvider) applyTransferLog(balances map[common.Address]*big.Int,
	currentLog types.Log, tokenID *big.Int,
) error {
	if len(currentLog.Topics) < 4 {
		return errors.New("not enough log topics")
	}
	from := common.BytesToAddress(currentLog.Topics[2].Bytes()[12:])
	to := common.BytesToAddress(currentLog.Topics[3].Bytes()[12:])
	switch currentLog.Topics[0] {
	case common.HexToHash(LOG_TOPIC_ERC1155_TRANSFER_SINGLE):
		event := parsedERC1155ABI.Events["TransferSingle"]
		values, err := event.Inputs.NonIndexed().Unpack(currentLog.Data)
		if err != nil {
			return err
		}
		id, ok := values[0].(*big.Int)
		if !ok {
			return errors.New("unexpected TransferSingle id type")
		}
		value, ok := values[1].(*big.Int)
		if !ok {
			return errors.New("unexpected TransferSingle value type")
		}
		if id.Cmp(tokenID) == 0 {
			applyERC1155Delta(balances, from, to, value)
		}
	case common.HexToHash(LOG_TOPIC_ERC1155_TRANSFER_BATCH):
		event := parsedERC1155ABI.Events["TransferBatch"]
		values, err := event.Inputs.NonIndexed().Unpack(currentLog.Data)
		if err != nil {
			return err
		}
		ids, ok := values[0].([]*big.Int)
		if !ok {
			return errors.New("unexpected TransferBatch ids type")
		}
		amounts, ok := values[1].([]*big.Int)
		if !ok {
			return errors.New("unexpected TransferBatch values type")
		}
		for i, id := range ids {
			if id.Cmp(tokenID) == 0 {
				applyERC1155Delta(balances, from, to, amounts[i])
			}
		}
	default:
		return errors.New("unknown ERC1155 transfer event")
	}
	return nil
}

func applyERC1155Delta(balances map[common.Address]*big.Int, from, to common.Address, value *big.Int) {
	if toBalance, ok := balances[to]; ok {
		balances[to] = new(big.Int).Add(toBalance, value)
	} else {
		balances[to] = new(big.Int).Set(value)
	}
	if fromBalance, ok := balances[from]; ok {
		balances[from] = new(big.Int).Sub(fromBalance, value)
	} else {
		balances[from] = new(big.Int).Neg(value)
	}
}

func parseERC1155TokenID(externalID []byte) (*big.Int, error) {
	tokenID, ok := new(big.Int).SetString(string(externalID), 10)
	if !ok {
		return nil, fmt.Errorf("erc1155 externalID must be a decimal token id")
	}
	return tokenID, nil
}

func (p *ERC1155HolderProvider) Close() error {
	return nil
}

func (p *ERC1155HolderProvider) IsExternal() bool {
	return false
}

func (p *ERC1155HolderProvider) IsSynced(_ []byte) bool {
	return p.synced.Load()
}

func (p *ERC1155HolderProvider) Address(_ []byte) common.Address {
	return p.address
}

func (p *ERC1155HolderProvider) Type() uint64 {
	return providers.CONTRACT_TYPE_ERC1155
}

func (p *ERC1155HolderProvider) TypeName() string {
	return providers.TokenTypeName(providers.CONTRACT_TYPE_ERC1155)
}

func (p *ERC1155HolderProvider) ChainID() uint64 {
	return p.chainID
}

func (p *ERC1155HolderProvider) Name(externalID []byte) (string, error) {
	tokenID, err := parseERC1155TokenID(externalID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ERC1155 %s", tokenID.String()), nil
}

func (p *ERC1155HolderProvider) Symbol(externalID []byte) (string, error) {
	tokenID, err := parseERC1155TokenID(externalID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ERC1155:%s", tokenID.String()), nil
}

func (p *ERC1155HolderProvider) Decimals(_ []byte) (uint64, error) {
	return 0, nil
}

func (p *ERC1155HolderProvider) TotalSupply(_ []byte) (*big.Int, error) {
	return nil, nil
}

func (p *ERC1155HolderProvider) BalanceOf(addr common.Address, externalID []byte) (*big.Int, error) {
	tokenID, err := parseERC1155TokenID(externalID)
	if err != nil {
		return nil, err
	}
	var balance *big.Int
	result := []interface{}{&balance}
	if err := p.contract.Call(nil, &result, "balanceOf", addr, tokenID); err != nil {
		return nil, err
	}
	return balance, nil
}

func (p *ERC1155HolderProvider) BalanceAt(_ context.Context, addr common.Address,
	externalID []byte, _ uint64,
) (*big.Int, error) {
	return p.BalanceOf(addr, externalID)
}

func (p *ERC1155HolderProvider) BlockTimestamp(ctx context.Context, blockNumber uint64) (string, error) {
	blockHeader, err := p.client.HeaderByNumber(ctx, new(big.Int).SetUint64(blockNumber))
	if err != nil {
		return "", err
	}
	return time.Unix(int64(blockHeader.Time), 0).Format(TimeLayout), nil
}

func (p *ERC1155HolderProvider) BlockRootHash(ctx context.Context, blockNumber uint64) ([]byte, error) {
	blockHeader, err := p.client.HeaderByNumber(ctx, new(big.Int).SetInt64(int64(blockNumber)))
	if err != nil {
		return nil, err
	}
	return blockHeader.Root.Bytes(), nil
}

func (p *ERC1155HolderProvider) LatestBlockNumber(ctx context.Context, _ []byte) (uint64, error) {
	lastBlockHeader, err := p.client.HeaderByNumber(ctx, nil)
	if err != nil {
		return 0, err
	}
	return lastBlockHeader.Number.Uint64(), nil
}

func (p *ERC1155HolderProvider) CreationBlock(ctx context.Context, _ []byte) (uint64, error) {
	if p.creationBlock == 0 {
		var err error
		p.creationBlock, err = creationBlock(p.client, ctx, p.address)
		return p.creationBlock, err
	}
	return p.creationBlock, nil
}

func (p *ERC1155HolderProvider) IconURI(externalID []byte) (string, error) {
	tokenID, err := parseERC1155TokenID(externalID)
	if err != nil {
		return "", err
	}
	var out string
	result := []interface{}{&out}
	if err := p.contract.Call(&bind.CallOpts{}, &result, "uri", tokenID); err != nil {
		return "", nil
	}
	return out, nil
}

func (p *ERC1155HolderProvider) CensusKeys(data map[common.Address]*big.Int) (map[common.Address]*big.Int, error) {
	return data, nil
}
