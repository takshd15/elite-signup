#!/usr/bin/env node

/**
 * Basic Encryption Test
 * Tests the encryption and decryption functions
 */

const crypto = require('crypto');

// Test encryption key
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

console.log('🔐 Testing Basic Encryption Functions...\n');

// Test 1: Simple message
const testMessage = 'Hello, this is a secret message! 🔐';
console.log(`📝 Original message: "${testMessage}"`);

const encrypted = encryptMessage(testMessage);
if (encrypted) {
  console.log(`🔒 Encrypted: ${encrypted.encrypted}`);
  console.log(`🔑 IV: ${encrypted.iv}`);
  
  const decrypted = decryptMessage(encrypted.encrypted, encrypted.iv);
  if (decrypted) {
    console.log(`🔓 Decrypted: "${decrypted}"`);
    
    if (decrypted === testMessage) {
      console.log('✅ Encryption/Decryption test PASSED!');
    } else {
      console.log('❌ Encryption/Decryption test FAILED!');
    }
  } else {
    console.log('❌ Decryption failed!');
  }
} else {
  console.log('❌ Encryption failed!');
}

console.log('\n🎉 Basic encryption test completed!');
