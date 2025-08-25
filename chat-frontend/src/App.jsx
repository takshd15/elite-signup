import React, { useState, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import LoginForm from './components/LoginForm'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('chatToken')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
      // You could validate the token here
    }
  }, [])

  const handleLogin = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    setIsAuthenticated(true)
    localStorage.setItem('chatToken', userToken)
  }

  // Temporary bypass for testing
  const handleTestLogin = () => {
    const testUser = {
      userId: 'testuser',
      username: 'testuser',
      email: 'testuser@elitescore.com',
      displayName: 'Test User'
    }
    setUser(testUser)
    setToken('test-token')
    setIsAuthenticated(true)
    localStorage.setItem('chatToken', 'test-token')
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('chatToken')
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>EliteScore Chat</h1>
        {isAuthenticated && (
          <div className="user-info">
            <span>Welcome, {user?.username || 'User'}!</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </header>
      
      <main>
        {isAuthenticated ? (
          <ChatInterface token={token} user={user} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <LoginForm onLogin={handleLogin} />
            <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <p style={{ color: 'white', marginBottom: '10px' }}>For testing (no backend required):</p>
              <button 
                onClick={handleTestLogin}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Test Login (Skip Authentication)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
