const jwt = require('jsonwebtoken');
const fs = require('fs');

// Use the same JWT secret as the server
const JWT_SECRET = '12341234123412341234123412341234123412341234';

console.log('🔑 Generating fresh JWT tokens for testing...');

// Generate tokens with future expiration (24 hours from now)
const now = Math.floor(Date.now() / 1000);
const exp = now + (24 * 60 * 60); // 24 hours from now

const tokens = {
  valid_tokens: [
    {
      token: jwt.sign({
        sub: 'user1',
        jti: 'test-jwt-123',
        iat: now,
        exp: exp
      }, JWT_SECRET),
      user: {
        userId: 1,
        username: 'user1',
        name: 'Test User 1'
      },
      jti: 'test-jwt-123'
    },
    {
      token: jwt.sign({
        sub: 'user2',
        jti: 'test-jwt-456',
        iat: now,
        exp: exp
      }, JWT_SECRET),
      user: {
        userId: 2,
        username: 'user2',
        name: 'Test User 2'
      },
      jti: 'test-jwt-456'
    },
    {
      token: jwt.sign({
        sub: 'user3',
        jti: 'test-jwt-789',
        iat: now,
        exp: exp
      }, JWT_SECRET),
      user: {
        userId: 3,
        username: 'user3',
        name: 'Test User 3'
      },
      jti: 'test-jwt-789'
    }
  ],
  revoked_token: {
    token: jwt.sign({
      sub: 'user4',
      jti: 'revoked-token',
      iat: now,
      exp: exp
    }, JWT_SECRET),
    user: {
      userId: 4,
      username: 'revoked_user',
      name: 'Revoked User'
    },
    jti: 'revoked-token'
  }
};

// Write to file
fs.writeFileSync('test-jwt-tokens.json', JSON.stringify(tokens, null, 2));

console.log('✅ Generated fresh JWT tokens:');
console.log(`   - Valid tokens: ${tokens.valid_tokens.length}`);
console.log(`   - Revoked token: 1`);
console.log(`   - Expiration: ${new Date(exp * 1000).toISOString()}`);
console.log('📄 Tokens saved to: test-jwt-tokens.json');

// Verify tokens work
console.log('\n🔍 Verifying tokens...');
tokens.valid_tokens.forEach((tokenData, index) => {
  try {
    const decoded = jwt.verify(tokenData.token, JWT_SECRET);
    console.log(`✅ Token ${index + 1} is valid: ${decoded.sub}`);
  } catch (error) {
    console.log(`❌ Token ${index + 1} is invalid: ${error.message}`);
  }
});
