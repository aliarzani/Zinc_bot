// scripts/test-encryption.js - Fixed version
const crypto = require('crypto');

function testEncryption() {
  const algorithm = 'aes-256-gcm';
  
  // Test with a sample Bitfinex API key
  const publicKey = 'abc123def456ghi789jkl012mno345pqr678'; // Sample public key
  const secretKey = '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f'; // Sample secret key
  
  console.log('Original Public Key:', publicKey);
  console.log('Original Secret Key:', secretKey);
  
  // Encrypt public key
  const key1 = crypto.randomBytes(32);
  const iv1 = crypto.randomBytes(16);
  const cipher1 = crypto.createCipheriv(algorithm, key1, iv1);
  let encryptedPublic = cipher1.update(publicKey, 'utf8', 'hex');
  encryptedPublic += cipher1.final('hex');
  const authTag1 = cipher1.getAuthTag();
  
  // Encrypt secret key
  const key2 = crypto.randomBytes(32);
  const iv2 = crypto.randomBytes(16);
  const cipher2 = crypto.createCipheriv(algorithm, key2, iv2);
  let encryptedSecret = cipher2.update(secretKey, 'utf8', 'hex');
  encryptedSecret += cipher2.final('hex');
  const authTag2 = cipher2.getAuthTag();
  
  console.log('Encrypted Public:', encryptedPublic);
  console.log('Encrypted Secret:', encryptedSecret);
  
  // Decrypt public key
  const decipher1 = crypto.createDecipheriv(algorithm, key1, iv1);
  decipher1.setAuthTag(authTag1);
  let decryptedPublic = decipher1.update(encryptedPublic, 'hex', 'utf8');
  decryptedPublic += decipher1.final('utf8');
  
  // Decrypt secret key
  const decipher2 = crypto.createDecipheriv(algorithm, key2, iv2);
  decipher2.setAuthTag(authTag2);
  let decryptedSecret = decipher2.update(encryptedSecret, 'hex', 'utf8');
  decryptedSecret += decipher2.final('utf8');
  
  console.log('Decrypted Public:', decryptedPublic);
  console.log('Decrypted Secret:', decryptedSecret);
  
  // Verify
  console.log('Public Key Match:', publicKey === decryptedPublic);
  console.log('Secret Key Match:', secretKey === decryptedSecret);
}

testEncryption();