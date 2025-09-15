# ⚡ Polygon zkEVM Plugin for ElizaOS

[![npm version](https://badge.fury.io/js/%40elizaos%2Fplugin-polygon-zkevm.svg)](https://badge.fury.io/js/%40elizaos%2Fplugin-polygon-zkevm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive ElizaOS plugin for interacting with Polygon zkEVM blockchain. This plugin enables AI agents to perform advanced zkEVM operations including balance queries, transaction management, smart contract deployment and interaction, cross-chain bridging, and zkEVM-specific features like batch information and block status checking.

## ✨ Features

### Core Blockchain Features
- 💰 **Balance Queries**: Check ETH and ERC-20 token balances
- 📋 **Account Operations**: Get detailed account information including nonce
- 🔄 **Transaction Management**: Send transactions, get receipts and details
- ⛽ **Gas Estimation**: Smart gas fee calculations for zkEVM transactions
- 📊 **Block Analytics**: Get latest blocks and detailed block information

### Advanced zkEVM Features
- 🚀 **Smart Contract Operations**: Deploy and interact with smart contracts
- 🌉 **Cross-Chain Bridging**: Bridge assets between Ethereum and Polygon zkEVM
- 🔗 **Message Bridging**: Send cross-chain messages between networks
- ✅ **Block Status Verification**: Check block finalization status on zkEVM
- 📦 **Batch Information**: Retrieve zkEVM batch details and sequencing data
- 🔍 **zkEVM-Specific Operations**: Specialized zero-knowledge features

### Developer Features
- 🔧 **Multiple Provider Support**: Alchemy API integration with RPC fallback
- 🛡️ **Comprehensive Error Handling**: Robust error management and validation
- 📝 **Type Safety**: Full TypeScript support with strict typing
- 🧪 **Extensive Testing**: Comprehensive test coverage for all operations

## 🚀 Quick Start

### Installation

```bash
bun add @elizaos/plugin-polygon-zkevm
```

### Basic Setup

1. **Environment Configuration**

Create a `.env` file in your project root:

```env
# Required: At least one provider must be configured
ALCHEMY_API_KEY=your_alchemy_api_key_here
# OR
ZKEVM_RPC_URL=https://polygonzkevm-mainnet.g.alchemy.com/v2

# Required for write operations (contract deployment, bridging, etc.)
PRIVATE_KEY=your_private_key_here
```

2. **Character Configuration**

Add to your character's `plugins` array:

```json
{
  "plugins": [
    "@elizaos/plugin-polygon-zkevm"
  ]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ALCHEMY_API_KEY` | ✅ Yes* | Alchemy API key for best performance | - |
| `ZKEVM_RPC_URL` | ✅ Yes* | Direct RPC endpoint (fallback option) | - |
| `PRIVATE_KEY` | ✅ Yes** | Private key for signing transactions | - |
| `WALLET_PRIVATE_KEY` | ❌ Optional | Alternative private key env var | - |

*At least one provider must be configured  
**Required for write operations only

### Runtime Configuration

Alternatively, configure through ElizaOS runtime:

```typescript
runtime.setSetting('ALCHEMY_API_KEY', 'your_alchemy_api_key');
runtime.setSetting('ZKEVM_RPC_URL', 'https://polygonzkevm-mainnet.g.alchemy.com/v2');
runtime.setSetting('PRIVATE_KEY', '0x1234567890abcdef...');
```

**Note**: Runtime settings take precedence over environment variables.

## 📖 Available Actions

### Balance & Account Operations

#### Get Balance
```
"What's my ETH balance?"
"Check balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
"Get USDC balance for 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```
**Triggers**: `GET_BALANCE`, `CHECK_BALANCE`, `BALANCE_LOOKUP`

#### Get Account Information
```
"Get account details for 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
"Check account info"
"Show my account details"
```
**Triggers**: `GET_ACCOUNT_BALANCE`, `ACCOUNT_INFO`, `CHECK_ACCOUNT`

### Transaction Operations

#### Get Transaction Details
```
"Get transaction 0x1234567890abcdef..."
"Show transaction details for 0x1234567890abcdef..."
"Lookup transaction hash 0x1234567890abcdef..."
```
**Triggers**: `GET_TRANSACTION`, `TRANSACTION_DETAILS`, `TX_LOOKUP`

#### Get Transaction Receipt
```
"Get receipt for transaction 0x1234567890abcdef..."
"Show transaction receipt 0x1234567890abcdef..."
"Check transaction status 0x1234567890abcdef..."
```
**Triggers**: `GET_TRANSACTION_RECEIPT`, `TX_RECEIPT`, `TRANSACTION_STATUS`

#### Estimate Transaction Fee
```
"Estimate fee for sending 0.1 ETH to 0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6"
"Calculate transaction fee with priority fee of 25 gwei"
"How much will it cost to call contract at 0x..."
```
**Triggers**: `ESTIMATE_TRANSACTION_FEE`, `GAS_ESTIMATION`, `CALCULATE_FEE`

### Smart Contract Operations

#### Deploy Smart Contract
```
"Deploy smart contract with bytecode 0x608060405234801561001057600080fd5b50..."
"Deploy contract with bytecode and constructor args [\"Hello World\", 1000]"
"Deploy contract with gas limit 2000000"
```
**Triggers**: `DEPLOY_SMART_CONTRACT`, `DEPLOY_CONTRACT`, `DEPLOY_ZKEVM_CONTRACT`, `CREATE_CONTRACT`

#### Interact with Smart Contracts
```
"Call balanceOf function on contract 0x1234... with args [\"0x742d35Cc...\"]"
"Execute transfer function on contract 0x1234... with value 100"
"Read from contract 0x1234... using function name"
```
**Triggers**: `INTERACT_WITH_SMART_CONTRACT`, `CALL_CONTRACT`, `CONTRACT_INTERACTION`

### Cross-Chain Bridging

#### Bridge Assets
```
"Bridge 0.1 ETH from ethereum to polygon zkevm"
"Deposit 100 USDC to polygon zkevm"
"Withdraw 50 USDT from polygon zkevm to ethereum"
"Bridge 1000 tokens at 0x1234... from ethereum to zkevm"
```
**Triggers**: `BRIDGE_ASSETS`, `BRIDGE_TOKENS`, `DEPOSIT_ASSETS`, `WITHDRAW_ASSETS`, `BRIDGE_ETH`, `BRIDGE_ERC20`

**Bridge Process**:
- **Deposits (Ethereum → zkEVM)**: Assets locked on Ethereum, minted on zkEVM (few minutes)
- **Withdrawals (zkEVM → Ethereum)**: Assets burned on zkEVM, 7-day challenge period, manual claim required

#### Bridge Messages
```
"Send message 'Hello zkEVM' from ethereum to polygon zkevm"
"Bridge message with data 0x1234 from zkevm to ethereum"
"Send cross-chain message to contract"
```
**Triggers**: `BRIDGE_MESSAGE`, `SEND_MESSAGE`, `CROSS_CHAIN_MESSAGE`

### zkEVM-Specific Operations

#### Check Block Status
```
"Check block status for block 1000000"
"Is block 1000000 finalized?"
"Verify block finalization status"
```
**Triggers**: `CHECK_BLOCK_STATUS`, `BLOCK_STATUS`, `IS_BLOCK_FINALIZED`

#### Get Batch Information
```
"Get batch info for batch 12345"
"Show batch details 12345"
"Retrieve zkEVM batch information"
```
**Triggers**: `GET_BATCH_INFO`, `BATCH_DETAILS`, `ZKEVM_BATCH_INFO`

### Network Information

#### Get Current Block Number
```
"What's the current block number?"
"Get latest block"
"Show current zkEVM block"
```
**Triggers**: `GET_CURRENT_BLOCK_NUMBER`, `LATEST_BLOCK`, `CURRENT_BLOCK`

#### Get Gas Price
```
"What's the current gas price?"
"Get gas price estimates"
"Show current network fees"
```
**Triggers**: `GET_GAS_PRICE`, `GAS_PRICE_INFO`, `NETWORK_FEES`

#### Get Block Details
```
"Get block details for block 1000000"
"Show block info for hash 0x1234567890abcdef..."
"Retrieve block information"
```
**Triggers**: `GET_BLOCK_DETAILS`, `BLOCK_INFO`, `BLOCK_LOOKUP`

## 🛠️ Development

### Building the Plugin

```bash
# Install dependencies
bun install

# Build the plugin
bun run build

# Run tests
bun test

# Run linting
bun run lint

# Check types
bun run typecheck
```

### Testing

The plugin includes comprehensive test coverage:

```bash
# Run all tests
bun test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch

# Test specific files
bun test -- deploySmartContract.test.ts
bun test -- bridgeAssets.test.ts
```

### Project Structure

```
src/
├── actions/           # Action implementations
│   ├── getBalance.ts
│   ├── deploySmartContract.ts
│   ├── bridgeAssets.ts
│   └── ...
├── services/         # Service layer
│   ├── zkevmService.ts
│   └── bridgeService.ts
├── templates/        # Response templates
├── utils/           # Utility functions
├── types.ts         # Type definitions
└── plugin.ts        # Main plugin export
```

## 🔒 Security

### Private Key Security
- Never commit private keys to version control
- Use environment variables for sensitive data
- Consider using hardware wallets for production
- Rotate private keys regularly

### Transaction Safety
- Always verify transaction parameters before execution
- Test deployments on testnets before mainnet
- Verify bridge operations and understand withdrawal periods
- Validate all contract bytecode before deployment

### Bridge Security
- Understand withdrawal periods (7 days for zkEVM → Ethereum)
- Verify destination addresses before bridging
- Monitor bridge contract status
- Keep track of withdrawal claims

### Best Practices
- Validate all user inputs
- Implement proper error handling
- Use type-safe operations
- Log transactions for auditing
- Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues

**Plugin Not Loading**
```bash
# Check environment variables
echo $ALCHEMY_API_KEY
echo $ZKEVM_RPC_URL
echo $PRIVATE_KEY
```

**RPC Connection Errors**
- Verify API keys are valid
- Check RPC URLs are accessible
- Try alternative providers
- Check for rate limiting

**Transaction Failures**
- Check account balance for gas fees
- Verify private key permissions
- Ensure contract addresses are correct
- Check network congestion

**Bridge Issues**
- Check token approval on source chain
- Verify sufficient balance for bridging
- Ensure destination address is valid
- Check bridge contract status
- Understand withdrawal periods

### Debug Mode

Enable debug logging:

```env
DEBUG=polygon-zkevm*
LOG_LEVEL=debug
```

### Network Information

- **Polygon zkEVM Mainnet Chain ID**: 1101
- **Ethereum Mainnet Chain ID**: 1
- **Polygon zkEVM Testnet Chain ID**: 1442

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for any changes
- Ensure TypeScript compliance
- Test with real transactions on testnets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Polygon zkEVM Documentation](https://docs.polygon.technology/zkEVM/)
- [ElizaOS Documentation](https://elizaos.github.io/eliza/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [viem Documentation](https://viem.sh/)
- [GitHub Repository](https://github.com/elizaos-plugins/plugin-polygon-zkevm)

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/elizaos-plugins/plugin-polygon-zkevm/issues)

---

**⚠️ Disclaimer**: This plugin interacts with blockchain networks and smart contracts. Always test thoroughly and understand the risks involved. Never invest more than you can afford to lose. Be especially careful with bridge operations as they may have long withdrawal periods and other restrictions.