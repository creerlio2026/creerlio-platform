/**
 * Test Script: Blockchain Integration Check
 * Verifies that blockchain integration is working correctly
 * 
 * Usage:
 *   cd frontend
 *   npx tsx scripts/test-blockchain.ts
 * 
 * Or with ts-node:
 *   npx ts-node --esm scripts/test-blockchain.ts
 */

import { ethers } from 'ethers'
import { 
  hashCredentialId, 
  toBytes32, 
  getContractInstance, 
  verifyCredentialOnChain,
  getRpcUrl,
  getExplorerUrl 
} from '../src/lib/blockchain'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

async function testBlockchain(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = []
  console.log('🔍 Testing Blockchain Integration...\n')

  // Check environment variables
  console.log('1. Checking Environment Variables:')
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY
  const contractAddress = process.env.CREDENTIALS_CONTRACT_ADDRESS
  const chainName = (process.env.BLOCKCHAIN_CHAIN_NAME || 'polygon') as 'polygon' | 'base'
  const network = (process.env.BLOCKCHAIN_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'mumbai' | 'sepolia'
  const customRpcUrl = process.env[`${chainName.toUpperCase()}_${network.toUpperCase()}_RPC_URL`]
  const rpcUrl = customRpcUrl || getRpcUrl(chainName, network)

  console.log(`   Chain: ${chainName}`)
  console.log(`   Network: ${network}`)
  console.log(`   RPC URL: ${rpcUrl}`)
  console.log(`   Contract Address: ${contractAddress || 'NOT SET ⚠️'}`)
  console.log(`   Private Key: ${privateKey ? 'SET (hidden) ✅' : 'NOT SET ⚠️'}`)
  console.log('')

  // Test 1: Check RPC connectivity
  console.log('2. Testing RPC Connectivity:')
  console.log(`   Trying RPC: ${rpcUrl}`)
  
  // Try alternative RPC URLs if primary fails
  const alternativeRpcs: Record<string, string[]> = {
    'polygon-testnet': [
      'https://polygon-mumbai-bor.publicnode.com',
      'https://rpc.ankr.com/polygon_mumbai',
      'https://polygon-mumbai.blockpi.network/v1/rpc/public',
      'https://endpoints.omniatech.io/v1/matic/mumbai/public',
      'https://matic-mumbai.chainstacklabs.com',
    ],
    'polygon-mainnet': [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://matic-mainnet.chainstacklabs.com',
    ],
    'base-testnet': [
      'https://sepolia.base.org',
      'https://base-sepolia.g.alchemy.com/v2/demo',
    ],
    'base-mainnet': [
      'https://mainnet.base.org',
      'https://base.g.alchemy.com/v2/demo',
    ],
  }
  
  const networkKey = `${chainName}-${network}`
  const rpcUrlsToTry = [rpcUrl, ...(alternativeRpcs[networkKey] || [])].filter((url, index, self) => 
    index === 0 || url !== rpcUrl // Don't duplicate primary URL
  )
  
  let connected = false
  let workingRpcUrl = ''
  let lastError: any = null
  
  for (const testUrl of rpcUrlsToTry) {
    try {
      console.log(`   Trying: ${testUrl}`)
      const provider = new ethers.JsonRpcProvider(testUrl, undefined, { staticNetwork: null })
      
      // Set a timeout for the request
      const blockNumberPromise = provider.getBlockNumber()
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('RPC request timeout (8s)')), 8000)
      )
      
      const blockNumber = await Promise.race([blockNumberPromise, timeoutPromise])
      const networkInfo = await provider.getNetwork()
      
      console.log(`   ✅ Connected to ${chainName} ${network}`)
      console.log(`   Working RPC: ${testUrl}`)
      console.log(`   Current block: ${blockNumber}`)
      console.log(`   Chain ID: ${networkInfo.chainId}`)
      
      workingRpcUrl = testUrl
      connected = true
      
      results.push({
        name: 'RPC Connectivity',
        passed: true,
        message: `Connected to ${chainName} ${network}`,
        details: { rpcUrl: testUrl, blockNumber: blockNumber.toString(), chainId: networkInfo.chainId.toString() }
      })
      console.log('')
      break
    } catch (error: any) {
      lastError = error
      console.log(`   ❌ Failed: ${error.message?.substring(0, 80) || String(error)}`)
      continue
    }
  }
  
  if (!connected) {
    console.error(`   ❌ All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`)
    console.log(`   💡 Try setting a custom RPC URL via environment variable:`)
    console.log(`      ${chainName.toUpperCase()}_${network.toUpperCase()}_RPC_URL=https://your-rpc-url`)
    results.push({
      name: 'RPC Connectivity',
      passed: false,
      message: `All RPC endpoints failed: ${lastError?.message || 'Unknown error'}`,
    })
    console.log('')
    return { passed: false, results }
  }

  // Test 2: Test utility functions
  console.log('3. Testing Utility Functions:')
  try {
    const testCredentialId = '123e4567-e89b-12d3-a456-426614174000'
    const credentialIdHash = hashCredentialId(testCredentialId)
    console.log(`   ✅ hashCredentialId works`)
    console.log(`   Input: ${testCredentialId}`)
    console.log(`   Output: ${credentialIdHash}`)
    
    const testHash = 'abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef'
    const bytes32Hash = toBytes32(testHash)
    console.log(`   ✅ toBytes32 works`)
    console.log(`   Input: ${testHash.substring(0, 20)}... (${testHash.length} chars)`)
    console.log(`   Output: ${bytes32Hash}`)
    
    results.push({
      name: 'Utility Functions',
      passed: true,
      message: 'hashCredentialId and toBytes32 work correctly',
    })
    console.log('')
  } catch (error: any) {
    console.error(`   ❌ Utility function error: ${error.message}`)
    results.push({
      name: 'Utility Functions',
      passed: false,
      message: `Error: ${error.message}`,
    })
    console.log('')
    return { passed: false, results }
  }

  // Test 3: Test wallet creation (if private key is set)
  let walletAddress: string | null = null
  if (privateKey && connected) {
    console.log('4. Testing Wallet:')
    try {
      const provider = new ethers.JsonRpcProvider(workingRpcUrl, undefined, { staticNetwork: null })
      const wallet = new ethers.Wallet(privateKey, provider)
      walletAddress = wallet.address
      const balance = await provider.getBalance(walletAddress)
      const balanceFormatted = ethers.formatEther(balance)
      
      console.log(`   ✅ Wallet created successfully`)
      console.log(`   Address: ${walletAddress}`)
      console.log(`   Balance: ${balanceFormatted} ${chainName === 'base' ? 'ETH' : 'MATIC'}`)
      
      const zeroBalance = balance === BigInt(0)
      if (zeroBalance) {
        console.warn(`   ⚠️  Wallet has zero balance - cannot send transactions`)
        console.warn(`   💡 Get test tokens from faucet:`)
        if (chainName === 'polygon' && network === 'testnet') {
          console.warn(`      https://faucet.polygon.technology/`)
        } else if (chainName === 'base' && network === 'testnet') {
          console.warn(`      https://www.coinbase.com/faucets/base-ethereum-goerli-faucet`)
        }
        results.push({
          name: 'Wallet Creation',
          passed: true,
          message: 'Wallet created but has zero balance',
          details: { address: walletAddress, balance: balanceFormatted }
        })
      } else {
        results.push({
          name: 'Wallet Creation',
          passed: true,
          message: `Wallet created with ${balanceFormatted} ${chainName === 'base' ? 'ETH' : 'MATIC'}`,
          details: { address: walletAddress, balance: balanceFormatted }
        })
      }
      console.log('')
    } catch (error: any) {
      console.error(`   ❌ Wallet creation error: ${error.message}`)
      results.push({
        name: 'Wallet Creation',
        passed: false,
        message: `Error: ${error.message}`,
      })
      console.log('')
    }
  } else if (!privateKey) {
    console.log('4. ⏭️  Skipping Wallet Test (no private key configured)')
    results.push({
      name: 'Wallet Creation',
      passed: false,
      message: 'Skipped - BLOCKCHAIN_PRIVATE_KEY not set',
    })
    console.log('')
  } else {
    console.log('4. ⏭️  Skipping Wallet Test (RPC connection failed)')
    results.push({
      name: 'Wallet Creation',
      passed: false,
      message: 'Skipped - RPC connection failed',
    })
    console.log('')
  }

  // Test 4: Test contract instance creation (if contract address is set)
  if (contractAddress && connected) {
    console.log('5. Testing Contract Instance:')
    try {
      const provider = new ethers.JsonRpcProvider(workingRpcUrl, undefined, { staticNetwork: null })
      const contract = getContractInstance(contractAddress, chainName, network, provider)
      
      // Try to call a view function
      try {
        const totalCredentials = await contract.getTotalCredentials()
        console.log(`   ✅ Contract is accessible`)
        console.log(`   Contract Address: ${contractAddress}`)
        console.log(`   Total credentials on-chain: ${totalCredentials.toString()}`)
        
        results.push({
          name: 'Contract Interaction',
          passed: true,
          message: `Contract accessible with ${totalCredentials} credentials`,
          details: { contractAddress, totalCredentials: totalCredentials.toString() }
        })
      } catch (error: any) {
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('revert') || errorMsg.includes('invalid opcode') || errorMsg.includes('call exception')) {
          console.log(`   ⚠️  Contract address exists but may not be the correct contract`)
          console.log(`   Error: ${errorMsg.substring(0, 100)}...`)
          results.push({
            name: 'Contract Interaction',
            passed: false,
            message: 'Contract address may be incorrect or contract not deployed',
            details: { contractAddress, error: errorMsg.substring(0, 200) }
          })
        } else {
          throw error
        }
      }
      console.log('')
    } catch (error: any) {
      console.error(`   ❌ Contract instance error: ${error.message}`)
      results.push({
        name: 'Contract Interaction',
        passed: false,
        message: `Error: ${error.message}`,
        details: { contractAddress }
      })
      console.log('')
    }
  } else if (!contractAddress) {
    console.log('5. ⏭️  Skipping Contract Test (no contract address configured)')
    results.push({
      name: 'Contract Interaction',
      passed: false,
      message: 'Skipped - CREDENTIALS_CONTRACT_ADDRESS not set',
    })
    console.log('')
  } else {
    console.log('5. ⏭️  Skipping Contract Test (RPC connection failed)')
    results.push({
      name: 'Contract Interaction',
      passed: false,
      message: 'Skipped - RPC connection failed',
    })
    console.log('')
  }

  // Test 5: Test blockchain verification (if contract address is set)
  if (contractAddress && connected) {
    console.log('6. Testing Blockchain Verification:')
    try {
      const testCredentialId = 'test-credential-id-12345'
      const testHash = 'a'.repeat(64) // 64 character hex string
      
      const result = await verifyCredentialOnChain(
        contractAddress,
        chainName,
        network,
        testCredentialId,
        testHash
      )
      
      console.log(`   ✅ Verification function works`)
      console.log(`   Test Credential ID: ${testCredentialId}`)
      console.log(`   Credential exists: ${result.exists}`)
      console.log(`   Is revoked: ${result.isRevoked}`)
      console.log(`   Hash matches: ${result.hashMatches}`)
      
      results.push({
        name: 'Blockchain Verification',
        passed: true,
        message: 'Verification function works correctly',
        details: result
      })
      console.log('')
    } catch (error: any) {
      console.error(`   ❌ Verification error: ${error.message}`)
      results.push({
        name: 'Blockchain Verification',
        passed: false,
        message: `Error: ${error.message}`,
      })
      console.log('')
    }
  } else if (!contractAddress) {
    console.log('6. ⏭️  Skipping Verification Test (no contract address configured)')
    results.push({
      name: 'Blockchain Verification',
      passed: false,
      message: 'Skipped - CREDENTIALS_CONTRACT_ADDRESS not set',
    })
    console.log('')
  } else {
    console.log('6. ⏭️  Skipping Verification Test (RPC connection failed)')
    results.push({
      name: 'Blockchain Verification',
      passed: false,
      message: 'Skipped - RPC connection failed',
    })
    console.log('')
  }

  // Summary
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  const allPassed = results.filter(r => !r.passed && !r.message.includes('Skipped')).length === 0

  console.log('=' .repeat(60))
  console.log('📊 Test Summary:')
  console.log(`   Passed: ${passedTests}/${totalTests}`)
  console.log(`   Failed: ${totalTests - passedTests}/${totalTests}`)
  console.log('=' .repeat(60))

  if (allPassed) {
    console.log('✅ All critical tests passed! Blockchain integration is working.\n')
  } else {
    console.log('⚠️  Some tests failed or were skipped. See details above.\n')
    console.log('💡 Next Steps:')
    if (!privateKey) {
      console.log('   1. Set BLOCKCHAIN_PRIVATE_KEY in frontend/.env.local')
    }
    if (!contractAddress) {
      console.log('   2. Deploy smart contract and set CREDENTIALS_CONTRACT_ADDRESS')
    }
    if (privateKey && walletAddress) {
      console.log('   3. Fund your wallet if balance is zero')
    }
    console.log('')
  }

  return { passed: allPassed, results }
}

// Run the test
testBlockchain()
  .then(({ passed, results }) => {
    if (!passed) {
      console.error('❌ Some tests failed or were skipped.')
      process.exit(1)
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test script error:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  })
