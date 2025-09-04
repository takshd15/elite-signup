const crypto = require('crypto');

// Security configuration - Using same JWT system as Java backend
// Java backend uses: Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Key))
// So we need to decode the base64 key to match exactly
const BASE64_KEY = '12341234123412341234123412341234123412341234';
const JWT_SECRET = Buffer.from(BASE64_KEY, 'base64'); // Decode base64 like Java backend
const CHAT_ENCRYPTION_KEY = 'super-secure-aes-encryption-key-32';

// Encryption functions
function encryptMessage(content) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(CHAT_ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function decryptMessage(encryptedData, iv) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(CHAT_ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

module.exports = {
  JWT_SECRET,
  CHAT_ENCRYPTION_KEY,
  encryptMessage,
  decryptMessage
};
