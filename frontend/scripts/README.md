# Test Scripts

## Blockchain Test Script

Test script to verify blockchain integration is working correctly.

### Usage

```bash
cd frontend
npm run test:blockchain
```

Or directly with tsx:

```bash
cd frontend
npx tsx scripts/test-blockchain.ts
```

### Prerequisites

1. **Environment Variables** (optional - tests will skip if not set):
   ```env
   # In frontend/.env.local
   BLOCKCHAIN_PRIVATE_KEY=0x...
   CREDENTIALS_CONTRACT_ADDRESS=0x...
   BLOCKCHAIN_CHAIN_NAME=polygon  # or 'base'
   BLOCKCHAIN_NETWORK=testnet     # or 'mainnet', 'mumbai', 'sepolia'
   ```

2. **Dependencies**:
   ```bash
   npm install tsx --save-dev  # If not already installed
   ```

### What It Tests

1. ✅ **Environment Variables** - Checks if blockchain config is set
2. ✅ **RPC Connectivity** - Tests connection to blockchain network
3. ✅ **Utility Functions** - Tests `hashCredentialId` and `toBytes32`
4. ✅ **Wallet Creation** - Tests wallet creation from private key (if set)
5. ✅ **Contract Interaction** - Tests contract instance and view functions (if contract address is set)
6. ✅ **Blockchain Verification** - Tests credential verification on-chain (if contract is set)

### Expected Output

```
🔍 Testing Blockchain Integration...

1. Checking Environment Variables:
   Chain: polygon
   Network: testnet
   RPC URL: https://rpc-mumbai.maticvigil.com
   Contract Address: NOT SET ⚠️
   Private Key: NOT SET ⚠️

2. Testing RPC Connectivity:
   ✅ Connected to polygon testnet
   Current block: 12345678
   Chain ID: 80001

3. Testing Utility Functions:
   ✅ hashCredentialId works
   ✅ toBytes32 works

4. ⏭️  Skipping Wallet Test (no private key configured)

5. ⏭️  Skipping Contract Test (no contract address configured)

6. ⏭️  Skipping Verification Test (no contract address configured)

============================================================
📊 Test Summary:
   Passed: 2/6
   Failed: 4/6
============================================================
⚠️  Some tests failed or were skipped. See details above.

💡 Next Steps:
   1. Set BLOCKCHAIN_PRIVATE_KEY in frontend/.env.local
   2. Deploy smart contract and set CREDENTIALS_CONTRACT_ADDRESS
```

### Troubleshooting

- **RPC Connection Failed**: Check your internet connection or try a different RPC URL
- **Contract Not Found**: Ensure the contract is deployed and the address is correct
- **Wallet Balance Zero**: Fund your wallet from a testnet faucet
- **Import Errors**: Make sure `tsx` is installed: `npm install tsx --save-dev`
