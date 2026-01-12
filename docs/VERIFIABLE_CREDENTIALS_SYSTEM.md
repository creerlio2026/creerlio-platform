# Verifiable Credentials System

## Overview

Creerlio's verifiable credential system provides blockchain-anchored credential verification with QR-based public verification. This system enables users to upload, store, and verify credentials with cryptographic integrity guarantees.

## Features

### Core Functionality
- ✅ **Credential Upload**: Upload credential documents (PDF, images, documents)
- ✅ **SHA-256 Hashing**: Cryptographic hash generation for file integrity
- ✅ **QR Code Generation**: Unique QR codes for each credential
- ✅ **Blockchain Anchoring**: Optional on-chain anchoring (Polygon/Base)
- ✅ **Public Verification**: Public verification page at `/verify/{token}`
- ✅ **Admin Dashboard**: Comprehensive credential management interface
- ✅ **Revocation Support**: Credential revocation with blockchain updates
- ✅ **Audit Trail**: Complete event logging for all credential operations
- ✅ **Privacy Controls**: Public, link-only, and private visibility options

### Trust Levels
- `self_asserted`: User-uploaded credential
- `ai_checked`: AI-verified credential
- `reviewed`: Human-reviewed credential
- `issuer_signed`: Issuer-verified credential

### Security Features
- Row Level Security (RLS) policies
- Signed URLs for file access
- No PII stored on-chain (only hashes)
- Server-side hash validation
- Token-based verification system

## Database Schema

### Tables

#### `credential_issuers`
Stores information about credential issuing organizations.

#### `credentials`
Main credentials table storing:
- Credential metadata (title, description, type, category)
- Status (active, expired, revoked, suspended)
- Trust level
- Privacy settings (visibility, mask_holder_name)
- SHA-256 hash of the credential file
- QR token for verification
- Issued and expiry dates

#### `credential_files`
Stores file attachments for credentials (supports multiple files per credential).

#### `blockchain_anchors`
Tracks blockchain transactions for credential anchoring:
- Transaction hash
- Block number
- Chain (Polygon/Base)
- Network (mainnet/testnet)
- Confirmation status

#### `verification_logs`
Logs all QR code scans and verification attempts.

#### `credential_events`
Complete audit trail of all credential operations.

#### `credential_qr_tokens`
Manages QR tokens and scan statistics.

## API Endpoints

### POST `/api/credentials/upload`
Upload a new credential.

**Request:**
- Form data with:
  - `file`: The credential file
  - `title`: Credential title (required)
  - `description`: Optional description
  - `credential_type`: Optional type
  - `category`: Optional category
  - `credential_issuer_id`: Optional issuer ID
  - `issued_date`: Optional issue date
  - `expiry_date`: Optional expiry date
  - `trust_level`: Trust level (default: `self_asserted`)
  - `visibility`: Visibility setting (default: `link_only`)

**Response:**
```json
{
  "success": true,
  "credential": {
    "id": "uuid",
    "title": "Credential Title",
    "qr_token": "token",
    "sha256_hash": "hash",
    "verification_url": "/verify/token"
  }
}
```

### POST `/api/credentials/anchor`
Anchor a credential on the blockchain.

**Request:**
```json
{
  "credentialId": "uuid",
  "chainName": "polygon",
  "network": "testnet",
  "contractAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "anchor": {
    "id": "uuid",
    "transaction_hash": "0x...",
    "block_number": 12345678,
    "transaction_url": "https://..."
  }
}
```

### GET `/api/credentials/verify?token={qr_token}`
Verify a credential via QR token (public endpoint).

**Response:**
```json
{
  "credential": {
    "id": "uuid",
    "title": "Credential Title",
    "description": "...",
    "issued_date": "2024-01-01",
    "expiry_date": "2026-01-01",
    "status": "active",
    "trust_level": "self_asserted",
    "issuer": {
      "name": "Issuer Name",
      "logo_url": "...",
      "website_url": "..."
    }
  },
  "verification": {
    "result": "valid",
    "hash_match": true,
    "blockchain_verified": true,
    "blockchain_tx_url": "https://..."
  }
}
```

### POST `/api/credentials/revoke`
Revoke a credential.

**Request:**
```json
{
  "credentialId": "uuid",
  "reason": "Optional reason"
}
```

### GET `/api/credentials/list?status={status}&trust_level={level}&admin={true}`
List credentials (requires authentication).

**Query Parameters:**
- `status`: Filter by status (active, expired, revoked, suspended)
- `trust_level`: Filter by trust level
- `admin`: Set to `true` for admin view (all credentials)

## Smart Contract

### Contract: `CreerlioCredentials.sol`

**Location:** `contracts/CreerlioCredentials.sol`

**Functions:**
- `issueCredential(bytes32 credentialIdHash, bytes32 sha256Hash)`: Anchor credential on-chain
- `revokeCredential(bytes32 credentialIdHash)`: Revoke credential on-chain
- `getCredential(bytes32 credentialIdHash)`: Retrieve credential details
- `verifyCredentialHash(bytes32 credentialIdHash, bytes32 sha256Hash)`: Verify hash matches
- `credentialExists(bytes32 credentialIdHash)`: Check if credential exists
- `isRevoked(bytes32 credentialIdHash)`: Check revocation status

**Events:**
- `CredentialIssued`: Emitted when credential is issued
- `CredentialRevoked`: Emitted when credential is revoked

## Frontend Pages

### `/verify/{token}`
Public verification page that displays credential details and verification status.

**Features:**
- Credential information display
- Verification status badges
- Trust level indicators
- Blockchain transaction links
- Hash match validation
- Creerlio branding

### `/dashboard/credentials/upload`
Credential upload interface for authenticated users.

**Features:**
- File upload with preview
- Form fields for credential metadata
- Issuer selection
- Trust level and visibility settings
- QR code generation after upload
- Direct verification link

### `/admin/credentials`
Admin dashboard for credential management.

**Features:**
- List all credentials with filters
- Status and trust level filtering
- Bulk selection and actions
- Individual credential actions (view, revoke)
- Statistics dashboard
- Verification count tracking

## Utilities

### `frontend/src/lib/crypto.ts`
SHA-256 hashing utilities:
- `computeFileHash(file: File)`: Hash a file
- `computeArrayBufferHash(buffer: ArrayBuffer)`: Hash from buffer
- `computeUrlHash(url: string)`: Hash from URL
- `compareHashes(hash1: string, hash2: string)`: Compare hashes

### `frontend/src/lib/blockchain.ts`
Blockchain integration utilities:
- `hashCredentialId(id: string)`: Hash UUID for on-chain storage
- `getContractInstance(...)`: Create contract instance
- `verifyCredentialOnChain(...)`: Verify credential on-chain
- `getTransactionUrl(...)`: Get blockchain explorer URL

### `frontend/src/lib/qr.ts`
QR code generation utilities:
- `generateQRCodeDataUrl(url: string)`: Generate QR as data URL
- `generateQRCodeSVG(url: string)`: Generate QR as SVG
- `getVerificationUrl(token: string)`: Build verification URL

## Setup Instructions

### 1. Database Migration

Run the migration file:
```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/20250110_create_verifiable_credentials_system.sql
```

### 2. Storage Bucket

Create a storage bucket named `credential-files` in Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `credential-files`
3. Make it private (files accessed via signed URLs)
4. RLS policies are already configured in the migration

### 3. Environment Variables

Add to `.env.local`:
```env
# Blockchain Configuration
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
POLYGON_TESTNET_RPC_URL=https://rpc-mumbai.maticvigil.com
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_TESTNET_RPC_URL=https://sepolia.base.org

# Contract Addresses (after deployment)
POLYGON_TESTNET_CONTRACT_ADDRESS=0x...
BASE_MAINNET_CONTRACT_ADDRESS=0x...
```

### 4. Install Dependencies

```bash
cd frontend
npm install ethers@^6.9.0 qrcode@^1.5.3
npm install --save-dev @types/qrcode@^1.5.5
```

### 5. Deploy Smart Contract

Deploy `contracts/CreerlioCredentials.sol` to your chosen network (Polygon or Base) using:
- Hardhat
- Remix
- Foundry
- Or your preferred deployment tool

Update the contract address in your environment variables.

### 6. Seed Demo Data (Optional)

Run the seed migration:
```sql
\i supabase/migrations/20250110_seed_demo_credentials.sql
```

## Usage Workflow

### 1. Upload Credential
1. User navigates to `/dashboard/credentials/upload`
2. Uploads credential file
3. Fills in metadata (title, description, etc.)
4. Selects issuer (optional)
5. Sets trust level and visibility
6. Submits form
7. Receives QR code and verification URL

### 2. Verify Credential
1. Anyone with QR code or verification URL navigates to `/verify/{token}`
2. System:
   - Loads credential details
   - Re-computes file hash
   - Compares with stored hash
   - Checks blockchain (if anchored)
   - Verifies status (active/expired/revoked)
3. Displays verification results

### 3. Anchor on Blockchain (Optional)
1. User navigates to credential management
2. Clicks "Anchor on Blockchain"
3. System:
   - Sends transaction to smart contract
   - Stores transaction hash and block number
   - Updates credential with blockchain info

### 4. Admin Management
1. Admin navigates to `/admin/credentials`
2. Filters credentials by status/trust level
3. Reviews credentials
4. Revokes credentials if needed
5. Views verification statistics

## Security Considerations

### Privacy
- **No PII on-chain**: Only credential ID hash and file hash stored on blockchain
- **Signed URLs**: File access via time-limited signed URLs
- **Visibility Controls**: Public, link-only, and private options

### Integrity
- **SHA-256 Hashing**: Cryptographic file integrity verification
- **Hash Comparison**: Always performed server-side
- **Blockchain Anchoring**: Immutable proof of credential existence

### Access Control
- **RLS Policies**: Database-level access control
- **Authentication Required**: All write operations require authentication
- **Owner Verification**: Users can only manage their own credentials

## Future Enhancements

- [ ] Batch credential upload
- [ ] Credential templates
- [ ] Automated expiry notifications
- [ ] Credential sharing via encrypted links
- [ ] Multi-signature issuer verification
- [ ] Credential versioning
- [ ] API webhooks for credential events
- [ ] Mobile app support
- [ ] Offline verification capability

## Troubleshooting

### QR Code Not Generating
- Ensure `qrcode` package is installed
- Check browser console for errors
- Verify verification URL is valid

### Blockchain Anchoring Fails
- Verify private key is set in environment variables
- Check RPC URL is correct and accessible
- Ensure contract address is correct
- Verify sufficient gas/balance in wallet

### File Upload Fails
- Check storage bucket exists and is named `credential-files`
- Verify RLS policies allow upload
- Check file size limits
- Verify user is authenticated

### Verification Shows Mismatch
- File may have been modified after upload
- Check if correct file is being hashed
- Verify storage file path is correct

## Support

For issues or questions, please refer to:
- Creerlio Platform Documentation
- Supabase Documentation
- Smart Contract Documentation (in `contracts/` directory)
