#!/usr/bin/env node

/**
 * Backend API Test Script for EliteScore
 * Tests the waitlist signup functionality
 */

const testBackendEndpoints = async () => {
  console.log('🚀 Testing EliteScore Backend Endpoints...\n')

  const possibleUrls = [
    'http://localhost:8080/v1',
    'http://localhost:8081/v1',
    'https://your-backend-url.herokuapp.com/v1', // Replace with your deployed URL
  ]

  // Test 1: Status endpoint
  console.log('📡 Testing Status Endpoint...')
  for (const baseUrl of possibleUrls) {
    try {
      const response = await fetch(`${baseUrl}/status`)
      if (response.ok) {
        const data = await response.text()
        console.log(`✅ Status endpoint working: ${baseUrl}/status`)
        console.log(`   Response: ${data.replace(/<[^>]*>/g, '')}`)
        break
      }
    } catch (error) {
      console.log(`❌ Failed to connect to ${baseUrl}/status`)
    }
  }

  // Test 2: Pre-signup endpoint
  console.log('\n📝 Testing Waitlist Signup Endpoint...')
  const testUser = {
    username: 'TestUser' + Date.now(),
    email: `test${Date.now()}@example.com`
  }

  for (const baseUrl of possibleUrls) {
    try {
      console.log(`🔄 Testing: ${baseUrl}/auth/pre-signup`)
      
      const response = await fetch(`${baseUrl}/auth/pre-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log(`✅ Waitlist signup working: ${baseUrl}/auth/pre-signup`)
        console.log(`   Response: ${data.message}`)
        console.log(`   Test user: ${testUser.username} (${testUser.email})`)
        break
      } else {
        console.log(`❌ Signup failed: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.log(`❌ Connection failed to ${baseUrl}/auth/pre-signup: ${error.message}`)
    }
  }

  // Test 3: Test duplicate user
  console.log('\n🔁 Testing Duplicate User Handling...')
  for (const baseUrl of possibleUrls) {
    try {
      const response = await fetch(`${baseUrl}/auth/pre-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser) // Same user as before
      })

      const data = await response.json()
      
      if (!response.ok && data.message) {
        console.log(`✅ Duplicate user handling working: ${data.message}`)
        break
      } else {
        console.log(`⚠️  Unexpected response for duplicate user`)
      }
    } catch (error) {
      console.log(`❌ Duplicate test failed: ${error.message}`)
    }
  }

  console.log('\n🎯 Backend Test Complete!')
}

// Run tests if this is the main module
if (require.main === module) {
  testBackendEndpoints().catch(console.error)
}

module.exports = { testBackendEndpoints }
