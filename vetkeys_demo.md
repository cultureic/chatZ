# VetKeys Encrypted Message Workflow

## Current Implementation Issue
The current code stores "encrypted_content" as plaintext, which defeats the purpose. Here's how it SHOULD work:

## Proper VetKeys Flow

### Step 1: Client-side - Get VetKD Public Key
```bash
# Client calls canister to get the VetKD public key for this message context
dfx canister --ic call chat_z_backend symmetric_key_verification_key_for_encrypted_message

# Response should be:
# (variant { Ok = vec { /* 32-byte public key */ } })
```

### Step 2: Client-side - Derive Message-Specific Key
```bash
# For message ID 123, client would call:
dfx canister --ic call chat_z_backend encrypted_symmetric_key_for_message '(123 : nat64)'

# Response (if authorized):
# (variant { Ok = vec { /* 32-byte encrypted symmetric key */ } })
```

### Step 3: Client-side - Encrypt Message with AES-GCM
```javascript
// Pseudo-code for client-side encryption:
const plaintext = "This secret message will self-destruct in 24 hours";
const messageId = 123;

// 1. Get the VetKD-derived symmetric key from canister
const encryptedKeyResponse = await canister.encrypted_symmetric_key_for_message(messageId);
const encryptedKey = encryptedKeyResponse.Ok;

// 2. Decrypt the key using client's transport keys (VetKD protocol)
const symmetricKey = decryptWithTransportKey(encryptedKey);

// 3. Encrypt the message content with AES-GCM
const ciphertext = aesGcmEncrypt(plaintext, symmetricKey);
const base64Ciphertext = btoa(ciphertext);

// 4. Send only the ciphertext to canister
const result = await canister.create_encrypted_message(
    base64Ciphertext, // This is what should be stored - NOT plaintext!
    channelId,
    null,
    { Text: null },
    []
);
```

### Step 4: Canister Stores Only Encrypted Data
```rust
// In the canister, we should store:
let encrypted_message = EncryptedMessage {
    id: message_id,
    encrypted_content: "SGVsbG8gV29ybGQh...", // base64 AES-GCM ciphertext
    author: caller,
    // ... other fields
};
```

### Step 5: Authorized Decryption
```bash
# When authorized user wants to read:
# 1. Get encrypted messages (returns only ciphertext)
dfx canister --ic call chat_z_backend get_encrypted_messages

# Returns:
# (vec {
#   record {
#     id = 123 : nat64;
#     encrypted_content = "SGVsbG8gV29ybGQh..."; // base64 ciphertext
#     author = principal "...";
#     expires_at = ...;
#   }
# })

# 2. Client gets the symmetric key for this message
dfx canister --ic call chat_z_backend encrypted_symmetric_key_for_message '(123 : nat64)'

# 3. Client decrypts locally
# const encryptedKey = response.Ok;
# const symmetricKey = decryptWithTransportKey(encryptedKey);
# const plaintext = aesGcmDecrypt(base64Decode(encrypted_content), symmetricKey);
# console.log(plaintext); // "This secret message will self-destruct in 24 hours"
```

## Security Properties

1. **Canister never sees plaintext** - Only encrypted ciphertext is stored
2. **Message-specific keys** - Each message uses unique derivation path
3. **Time-based expiration** - Messages auto-delete after 24 hours
4. **Authorization-based access** - Only owner + shared users can get symmetric keys
5. **Zero-knowledge sharing** - Sharing grants access to VetKey, not decrypted content

## Current Demo Limitations

Due to mainnet VetKD key limitations, the current demo shows the structure but:
- Uses placeholder key names that may not exist on mainnet
- Shows the concept but would need proper VetKD setup for full functionality

## What We Proved

✅ **Encrypted channel creation** - with `is_encrypted = true` and 🔒 prefix
✅ **Message expiration logic** - 24-hour TTL with cleanup
✅ **Authorization control** - owner + shared user access
✅ **Proper API structure** - VetKD integration points ready
✅ **Base64 validation** - for ciphertext input validation

The infrastructure is ready for proper VetKeys integration once the key management is properly configured!
