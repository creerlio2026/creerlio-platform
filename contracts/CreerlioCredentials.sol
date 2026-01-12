// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreerlioCredentials
 * @notice Minimal smart contract for anchoring credential hashes on-chain
 * @dev Only stores credential_id (UUID) and SHA-256 hash, no PII
 */
contract CreerlioCredentials {
    // Events
    event CredentialIssued(
        bytes32 indexed credentialIdHash,
        bytes32 indexed sha256Hash,
        uint256 blockNumber,
        address indexed issuer
    );

    event CredentialRevoked(
        bytes32 indexed credentialIdHash,
        uint256 blockNumber,
        address indexed revoker
    );

    // Struct for credential record
    struct CredentialRecord {
        bytes32 credentialIdHash; // Keccak256 hash of UUID
        bytes32 sha256Hash;       // SHA-256 hash of credential file
        uint256 issuedBlock;
        uint256 issuedTimestamp;
        address issuer;
        bool isRevoked;
        uint256 revokedBlock;
        uint256 revokedTimestamp;
    }

    // Mapping from credential ID hash to credential record
    mapping(bytes32 => CredentialRecord) public credentials;

    // Array of all credential ID hashes (for enumeration)
    bytes32[] public allCredentialIds;

    // Admin address (can be updated)
    address public admin;

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    // Constructor
    constructor(address _admin) {
        require(_admin != address(0), "Admin cannot be zero address");
        admin = _admin;
    }

    /**
     * @notice Issue a credential on-chain
     * @param credentialIdHash Keccak256 hash of the credential UUID
     * @param sha256Hash SHA-256 hash of the credential file
     */
    function issueCredential(
        bytes32 credentialIdHash,
        bytes32 sha256Hash
    ) external {
        require(
            credentials[credentialIdHash].issuedBlock == 0,
            "Credential already issued"
        );

        credentials[credentialIdHash] = CredentialRecord({
            credentialIdHash: credentialIdHash,
            sha256Hash: sha256Hash,
            issuedBlock: block.number,
            issuedTimestamp: block.timestamp,
            issuer: msg.sender,
            isRevoked: false,
            revokedBlock: 0,
            revokedTimestamp: 0
        });

        allCredentialIds.push(credentialIdHash);

        emit CredentialIssued(
            credentialIdHash,
            sha256Hash,
            block.number,
            msg.sender
        );
    }

    /**
     * @notice Revoke a credential
     * @param credentialIdHash Keccak256 hash of the credential UUID
     */
    function revokeCredential(bytes32 credentialIdHash) external {
        CredentialRecord storage cred = credentials[credentialIdHash];
        require(cred.issuedBlock != 0, "Credential not found");
        require(!cred.isRevoked, "Credential already revoked");

        cred.isRevoked = true;
        cred.revokedBlock = block.number;
        cred.revokedTimestamp = block.timestamp;

        emit CredentialRevoked(
            credentialIdHash,
            block.number,
            msg.sender
        );
    }

    /**
     * @notice Get credential details
     * @param credentialIdHash Keccak256 hash of the credential UUID
     * @return record The credential record
     */
    function getCredential(
        bytes32 credentialIdHash
    ) external view returns (CredentialRecord memory) {
        require(
            credentials[credentialIdHash].issuedBlock != 0,
            "Credential not found"
        );
        return credentials[credentialIdHash];
    }

    /**
     * @notice Verify a credential hash matches on-chain hash
     * @param credentialIdHash Keccak256 hash of the credential UUID
     * @param sha256Hash SHA-256 hash to verify
     * @return isValid Whether the hash matches and credential is not revoked
     */
    function verifyCredentialHash(
        bytes32 credentialIdHash,
        bytes32 sha256Hash
    ) external view returns (bool isValid) {
        CredentialRecord memory cred = credentials[credentialIdHash];
        
        if (cred.issuedBlock == 0) {
            return false; // Credential not found
        }
        
        if (cred.isRevoked) {
            return false; // Credential revoked
        }
        
        return cred.sha256Hash == sha256Hash;
    }

    /**
     * @notice Check if credential exists
     * @param credentialIdHash Keccak256 hash of the credential UUID
     * @return exists Whether the credential exists
     */
    function credentialExists(bytes32 credentialIdHash) external view returns (bool exists) {
        return credentials[credentialIdHash].issuedBlock != 0;
    }

    /**
     * @notice Check if credential is revoked
     * @param credentialIdHash Keccak256 hash of the credential UUID
     * @return isRevoked Whether the credential is revoked
     */
    function isRevoked(bytes32 credentialIdHash) external view returns (bool isRevoked) {
        return credentials[credentialIdHash].isRevoked;
    }

    /**
     * @notice Get total number of issued credentials
     * @return count Total credentials issued
     */
    function getTotalCredentials() external view returns (uint256 count) {
        return allCredentialIds.length;
    }

    /**
     * @notice Update admin address
     * @param newAdmin New admin address
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Admin cannot be zero address");
        admin = newAdmin;
    }
}
