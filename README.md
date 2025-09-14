# @elizaos/plugin-polygon-zkevm

This plugin provides comprehensive functionality for interacting with Polygon zkEVM blockchain through ElizaOS.

## Description

The Polygon zkEVM plugin offers a complete suite of blockchain operations including balance queries, transaction management, smart contract deployment and interaction, cross-chain bridging, and advanced zkEVM-specific features like batch information and block status checking.

## Features

- **Blockchain Queries**: Block information, transaction details, and account balances
- **Transaction Management**: Gas estimation, fee calculation, and transaction execution
- **Smart Contract Operations**: Deploy and interact with smart contracts
- **Cross-Chain Bridging**: Bridge assets and messages between Ethereum and Polygon zkEVM
- **zkEVM-Specific Features**: Batch information, block status, and specialized zkEVM operations
- **Multiple Provider Support**: Alchemy API integration with RPC fallback
- **Comprehensive Error Handling**: Robust error management and validation
- **Type Safety**: Full TypeScript support with strict typing

## Installation

```bash
bun add @elizaos/plugin-polygon-zkevm
```

## Configuration

### Required Environment Variables

```env
# At least one provider must be configured
ALCHEMY_API_KEY=your-alchemy-api-key-here
# OR
ZKEVM_RPC_URL=https://polygonzkevm-mainnet.g.alchemy.com/v2

# Required for write operations (contract deployment, bridging, etc.)
PRIVATE_KEY=your-private-key-here
```

### Environment Configuration

```env
# Alchemy API (recommended for best performance)
ALCHEMY_API_KEY=your_alchemy_api_key

# Direct RPC endpoint (fallback option)
ZKEVM_RPC_URL=https://polygonzkevm-mainnet.g.alchemy.com/v2

# Private key for write operations
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Runtime Configuration

Alternatively, configure through ElizaOS runtime:

```typescript
runtime.setSetting('ALCHEMY_API_KEY', 'your_alchemy_api_key');
runtime.setSetting('ZKEVM_RPC_URL', 'https://polygonzkevm-mainnet.g.alchemy.com/v2');
runtime.setSetting('PRIVATE_KEY', '0x1234567890abcdef...');
```

**Note**: Runtime settings take precedence over environment variables.

## Actions

### 1. Balance & Account Operations

#### Get Balance
Query account balances for ETH and ERC-20 tokens.

```typescript
// Examples
"What's my ETH balance?"
"Check balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
"Get USDC balance for 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```

#### Get Account Balance
Get detailed account information including nonce and balance.

```typescript
// Examples
"Get account details for 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
"Check account info"
```

### 2. Transaction Operations

#### Get Transaction Details
Retrieve comprehensive transaction information.

```typescript
// Examples
"Get transaction 0x1234567890abcdef..."
"Show transaction details for 0x1234567890abcdef..."
```

#### Get Transaction Receipt
Get transaction receipt with execution details.

```typescript
// Examples
"Get receipt for transaction 0x1234567890abcdef..."
"Show transaction receipt 0x1234567890abcdef..."
```

#### Estimate Transaction Fee
Calculate gas costs for transactions.

```typescript
// Examples
"Estimate fee for sending 0.1 ETH to 0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6"
"Calculate transaction fee with priority fee of 25 gwei"
"How much will it cost to call contract at 0x..."
```

### 3. Smart Contract Operations

#### Deploy Smart Contract
Deploy contracts to Polygon zkEVM.

**Action Name**: `DEPLOY_SMART_CONTRACT`
**Aliases**: `DEPLOY_CONTRACT`, `DEPLOY_ZKEVM_CONTRACT`, `CREATE_CONTRACT`

**Requirements**:
- `PRIVATE_KEY` must be configured
- `ALCHEMY_API_KEY` or `ZKEVM_RPC_URL` must be configured

```typescript
// Examples
"deploy smart contract with bytecode 0x608060405234801561001057600080fd5b50..."
"deploy contract with bytecode 0x608060405234801561001057600080fd5b50... and constructor args [\"Hello World\", 1000]"
"deploy contract with bytecode 0x608060405234801561001057600080fd5b50... with gas limit 2000000"
```

#### Interact with Smart Contracts
Call contract functions and execute transactions.

```typescript
// Examples
"call balanceOf function on contract 0x1234567890123456789012345678901234567890 with args [\"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\"]"
"execute transfer function on contract 0x1234567890123456789012345678901234567890"
```

### 4. Cross-Chain Bridging

#### Bridge Assets
Bridge ETH or ERC-20 tokens between Ethereum and Polygon zkEVM.

**Action Name**: `BRIDGE_ASSETS`
**Aliases**: `BRIDGE_TOKENS`, `DEPOSIT_ASSETS`, `WITHDRAW_ASSETS`, `BRIDGE_ETH`, `BRIDGE_ERC20`

**Requirements**:
- `PRIVATE_KEY` must be configured
- `ALCHEMY_API_KEY` or `ZKEVM_RPC_URL` must be configured

**Supported Operations**:
- **Deposit**: Transfer assets from Ethereum mainnet to Polygon zkEVM
- **Withdraw**: Transfer assets from Polygon zkEVM to Ethereum mainnet

```typescript
// Examples
"bridge 0.1 ETH from ethereum to polygon zkevm"
"deposit 100 USDC to polygon zkevm"
"withdraw 50 USDT from polygon zkevm to ethereum"
"bridge 1000 tokens at 0x1234567890123456789012345678901234567890 from ethereum to zkevm"
```

**Bridge Process**:

1. **Deposits (Ethereum → zkEVM)**:
   - Assets are locked on Ethereum mainnet
   - Equivalent assets are minted on Polygon zkEVM
   - Process typically takes a few minutes
   - Auto-claiming is enabled by default

2. **Withdrawals (zkEVM → Ethereum)**:
   - Assets are burned on Polygon zkEVM
   - Must wait for challenge period (typically 7 days)
   - Manual claim required on Ethereum mainnet after challenge period

#### Bridge Messages
Send cross-chain messages between networks.

```typescript
// Examples
"send message 'Hello zkEVM' from ethereum to polygon zkevm"
"bridge message with data 0x1234 from zkevm to ethereum"
```

### 5. zkEVM-Specific Operations

#### Check Block Status
Verify block finalization and status on zkEVM.

```typescript
// Examples
"check block status for block 1000000"
"is block 1000000 finalized?"
```

#### Get Batch Information
Retrieve zkEVM batch details and sequencing information.

```typescript
// Examples
"get batch info for batch 12345"
"show batch details 12345"
```

### 6. Network Information

#### Get Current Block Number
Get the latest block number.

```typescript
// Examples
"what's the current block number?"
"get latest block"
```

#### Get Gas Price
Get current gas price information.

```typescript
// Examples
"what's the current gas price?"
"get gas price estimates"
```

#### Get Block Details
Get detailed information about specific blocks.

```typescript
// Examples
"get block details for block 1000000"
"show block info for hash 0x1234567890abcdef..."
```

## Development

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Build the plugin:

```bash
bun run build
```

4. Run tests:

```bash
bun test
```

### Testing

Run all tests:

```bash
npm test
```

For specific test files:

```bash
npm test -- deploySmartContract.test.ts
npm test -- bridgeAssets.test.ts
```

## API Reference

### Core Components

1. **Configuration Schema**
   - Validates API keys and RPC URLs
   - Ensures proper provider configuration
   - Handles environment variable fallbacks

2. **Actions**
   - Balance queries and account operations
   - Transaction management and estimation
   - Smart contract deployment and interaction
   - Cross-chain bridging operations
   - zkEVM-specific features

3. **Providers**
   - Alchemy API integration
   - JSON-RPC fallback support
   - Automatic retry mechanisms
   - Error handling and validation

## Security

- **Never expose your private key** in logs, code, or version control
- Use environment variables or secure runtime configuration for sensitive data
- Validate all contract bytecode before deployment
- Test deployments on testnets before mainnet
- Verify bridge operations and understand withdrawal periods
- Always validate transaction parameters before execution

## Future Enhancements

1. **Advanced zkEVM Features**
   - Enhanced batch processing
   - Proof verification tools
   - State transition monitoring
   - Rollup analytics
   - Performance optimization
   - Custom proof generation

2. **Bridge Improvements**
   - Bridge aggregation
   - Fee optimization
   - Faster finality options
   - Multi-asset bridging
   - Bridge monitoring tools
   - Emergency withdrawal features

3. **Smart Contract Tools**
   - Contract verification automation
   - Upgrade management
   - Security analysis integration
   - Gas optimization tools
   - ABI management system
   - Template library

4. **Developer Experience**
   - Enhanced debugging tools
   - Transaction simulation
   - Performance profiling
   - Integration templates
   - CLI improvements
   - Documentation generator

## Contributing

The plugin contains comprehensive tests. Please run tests before submitting PRs:

```bash
bun test
```

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## Credits

This plugin integrates with and builds upon several key technologies:

- [Polygon zkEVM](https://polygon.technology/polygon-zkevm): Zero-knowledge Ethereum Virtual Machine
- [Alchemy](https://alchemy.com/): Blockchain infrastructure platform
- [Ethereum](https://ethereum.org/): Decentralized blockchain platform
- [viem](https://viem.sh/): TypeScript interface for Ethereum
- [ElizaOS](https://github.com/elizaos/eliza): AI agent framework

Special thanks to:

- The Polygon team for zkEVM development
- The Ethereum community for foundational technology
- The ElizaOS community for contributions and feedback

For more information about Polygon zkEVM:

- [Polygon zkEVM Documentation](https://docs.polygon.technology/zkEVM/)
- [Ethereum Documentation](https://ethereum.org/developers/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [viem Documentation](https://viem.sh/)

## License

This plugin is part of the ElizaOS project. See the main project repository for license information.