# Wallet Signup Endpoint - Test Data

## Sample Test Request

### Using a Valid Solana Test Wallet

```json
{
  "walletAddress": "11111111111111111111111111111112",
  "signature": "KJm8qI+8wnEjsFqwM8mCkpCMfqZfJ3PmLKVFzKqC3XvXvPfmVZaYjmqA1vE5qT2Y8pL5nM2oQ6rS7tU8vW9xA==",
  "message": "Sign this message to verify wallet ownership: nonce123456"
}
```

---

## How to Generate Real Test Data

### Option 1: Using Phantom Wallet (Recommended for Frontend Testing)

1. **Install Phantom Wallet**: https://phantom.app/
2. **Create/Import a Test Wallet**
3. **Use this JavaScript code in browser console**:

```javascript
// In browser console with Phantom connected
async function generateWalletSignature() {
  if (!window.solana || !window.solana.isPhantom) {
    console.error('Phantom wallet not found');
    return;
  }

  try {
    // Connect wallet if not already connected
    const resp = await window.solana.connect();
    const walletAddress = resp.publicKey.toString();
    console.log('Wallet Address:', walletAddress);

    // Message to sign
    const message = `Sign this message to verify wallet ownership: ${Date.now()}`;
    console.log('Message:', message);

    // Request signature
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await window.solana.signMessage(encodedMessage);
    
    // Convert signature to base64
    const signatureBase64 = Buffer.from(signedMessage.signature).toString('base64');
    console.log('Signature (Base64):', signatureBase64);

    // Construct request
    const testData = {
      walletAddress,
      signature: signatureBase64,
      message
    };

    console.log('Complete Test Data:');
    console.log(JSON.stringify(testData, null, 2));

    return testData;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function
generateWalletSignature();
```

### Option 2: Using @solana/web3.js (For Backend Testing)

```javascript
// Node.js script to generate test data
const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js');

// Generate a keypair for testing
const keypair = nacl.sign.keyPair();

// Create a wallet public key
const walletAddress = new PublicKey(keypair.publicKey).toString();
console.log('Wallet Address:', walletAddress);

// Message to sign
const message = `Sign this message to verify wallet ownership: ${Date.now()}`;
console.log('Message:', message);

// Sign the message
const messageBytes = new TextEncoder().encode(message);
const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
const signatureBase64 = Buffer.from(signatureBytes).toString('base64');
console.log('Signature (Base64):', signatureBase64);

// Test data
const testData = {
  walletAddress,
  signature: signatureBase64,
  message
};

console.log('\nComplete Test Data:');
console.log(JSON.stringify(testData, null, 2));
```

---

## Sample Curl Request

```bash
curl -X POST http://localhost:3000/auth/wallet/signup \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "11111111111111111111111111111112",
    "signature": "KJm8qI+8wnEjsFqwM8mCkpCMfqZfJ3PmLKVFzKqC3XvXvPfmVZaYjmqA1vE5qT2Y8pL5nM2oQ6rS7tU8vW9xA==",
    "message": "Sign this message to verify wallet ownership: nonce123456"
  }'
```

---

## Sample Postman Configuration

**Request Type**: POST

**URL**: `http://localhost:3000/auth/wallet/signup`

**Headers**:
```
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "walletAddress": "11111111111111111111111111111112",
  "signature": "KJm8qI+8wnEjsFqwM8mCkpCMfqZfJ3PmLKVFzKqC3XvXvPfmVZaYjmqA1vE5qT2Y8pL5nM2oQ6rS7tU8vW9xA==",
  "message": "Sign this message to verify wallet ownership: nonce123456"
}
```

---

## Expected Success Response (201)

```json
{
  "error": false,
  "message": "Wallet signup successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Web3",
    "lastName": "User",
    "walletAddress": "11111111111111111111111111111112",
    "email": "11111111111111111111111111111112@wallet.local",
    "organizationName": "Web3 Organization",
    "createdAt": "2025-12-03T10:30:00.000Z",
    "updatedAt": "2025-12-03T10:30:00.000Z"
  }
}
```

---

## Expected Error Responses

### Invalid Wallet Address (400)
```json
{
  "error": true,
  "message": "Invalid wallet address"
}
```

### Invalid Signature (401)
```json
{
  "error": true,
  "message": "Invalid wallet signature"
}
```

### Wallet Already Registered (400)
```json
{
  "error": true,
  "message": "Wallet address already registered"
}
```

### Missing Required Fields (400)
```json
{
  "error": true,
  "message": "walletAddress, signature, and message are required"
}
```

---

## Quick Test Wallets (Devnet)

For development/testing on Solana Devnet:

| Wallet Address | Type |
|---|---|
| `11111111111111111111111111111112` | System Program |
| `TokenkegQfeZyiNwAJsyFbPVwwQQfuBVvqWydDSgv5` | Token Program |

---

## Testing Workflow

1. **Generate Signature** using one of the methods above
2. **Copy the test data** (walletAddress, signature, message)
3. **Send POST request** to `/auth/wallet/signup`
4. **Verify response** includes accessToken and user data
5. **Use accessToken** for subsequent authenticated requests

---

## Notes

- The signature must match the wallet address and message exactly
- If signature verification fails, you'll get a 401 error
- Each wallet can only be registered once
- The user is created with default Web3 identity
- A wallet record is automatically created with the account
