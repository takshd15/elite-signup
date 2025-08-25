import React, { useState, useEffect, useRef } from 'react'
import './ChatInterface.css'

const ChatInterface = ({ token, user }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [channels, setChannels] = useState([
    { id: 'general', name: 'General', active: true },
    { id: 'feedback', name: 'Feedback', active: false },
    { id: 'career', name: 'Career', active: false },
    { id: 'learning', name: 'Learning', active: false },
    { id: 'networking', name: 'Networking', active: false }
  ])
  const [currentChannel, setCurrentChannel] = useState('general')
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:3001')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to chat server')
      setIsConnected(true)
      
      // Authenticate with JWT token
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onclose = () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [token])

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'authenticated':
        console.log('Authenticated successfully')
        // Join the current channel
        joinChannel(currentChannel)
        break
        
      case 'channel_joined':
        setMessages(data.messages || [])
        setOnlineUsers(data.onlineUsers || [])
        break
        
      case 'new_message':
        setMessages(prev => [...prev, data.message])
        break
        
      case 'user_joined':
        setOnlineUsers(prev => [...prev, data.user])
        break
        
      case 'user_left':
        setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id))
        break
        
      case 'typing_update':
        setTypingUsers(data.typing || [])
        break
        
      case 'reaction_added':
        setMessages(prev => prev.map(msg => 
          msg.id === data.reaction.messageId 
            ? { ...msg, reactions: [...(msg.reactions || []), data.reaction] }
            : msg
        ))
        break
        
      case 'reaction_removed':
        setMessages(prev => prev.map(msg => 
          msg.id === data.data.messageId 
            ? { 
                ...msg, 
                reactions: (msg.reactions || []).filter(r => 
                  !(r.userId === data.data.userId && r.emoji === data.data.emoji)
                )
              }
            : msg
        ))
        break
        
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const joinChannel = (channelId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_channel',
        channelId: channelId
      }))
      
      // Update channel active state
      setChannels(prev => prev.map(ch => ({
        ...ch,
        active: ch.id === channelId
      })))
      setCurrentChannel(channelId)
      setReplyTo(null)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return

    const messageData = {
      type: 'send_message',
      channelId: currentChannel,
      content: newMessage.trim(),
      threadId: replyTo ? replyTo.threadId : null,
      replyTo: replyTo ? replyTo.messageId : null
    }

    wsRef.current.send(JSON.stringify(messageData))
    setNewMessage('')
    setReplyTo(null)
    setIsTyping(false)
    
    // Send typing stop
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        channelId: currentChannel,
        isTyping: false
      }))
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          channelId: currentChannel,
          isTyping: true
        }))
      }
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          channelId: currentChannel,
          isTyping: false
        }))
      }
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addReaction = (messageId, emoji) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'add_reaction',
        messageId: messageId,
        emoji: emoji
      }))
    }
  }

  const removeReaction = (messageId, emoji) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'remove_reaction',
        messageId: messageId,
        emoji: emoji
      }))
    }
  }

  const handleReply = (message) => {
    setReplyTo({
      messageId: message.id,
      threadId: message.threadId || message.id,
      content: message.content,
      username: message.username
    })
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <div className="channels-section">
          <h3>Channels</h3>
          <div className="channel-list">
            {channels.map(channel => (
              <button
                key={channel.id}
                className={`channel-item ${channel.active ? 'active' : ''}`}
                onClick={() => joinChannel(channel.id)}
              >
                # {channel.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="users-section">
          <h3>Online Users ({onlineUsers.length})</h3>
          <div className="user-list">
            {onlineUsers.map(user => (
              <div key={user.id} className="user-item">
                <span className="user-status online"></span>
                {user.username}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>#{channels.find(c => c.id === currentChannel)?.name}</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.userId === user?.userId ? 'sent' : 'received'}`}>
              <div className="message-header">
                <span className="message-author">{message.username}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              
              {message.replyTo && (
                <div className="message-reply">
                  <span className="reply-label">Replying to:</span>
                  <span className="reply-content">{message.replyTo}</span>
                </div>
              )}
              
              <div className="message-content">{message.content}</div>
              
              {message.reactions && message.reactions.length > 0 && (
                <div className="message-reactions">
                  {message.reactions.map((reaction, index) => (
                    <button
                      key={index}
                      className="reaction"
                      onClick={() => removeReaction(message.id, reaction.emoji)}
                    >
                      {reaction.emoji} {reaction.count || 1}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="message-actions">
                <button 
                  className="action-btn"
                  onClick={() => addReaction(message.id, '👍')}
                >
                  👍
                </button>
                <button 
                  className="action-btn"
                  onClick={() => addReaction(message.id, '❤️')}
                >
                  ❤️
                </button>
                <button 
                  className="action-btn"
                  onClick={() => addReaction(message.id, '😂')}
                >
                  😂
                </button>
                <button 
                  className="action-btn reply-btn"
                  onClick={() => handleReply(message)}
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          {replyTo && (
            <div className="reply-preview">
              <span>Replying to: {replyTo.content}</span>
              <button onClick={cancelReply} className="cancel-reply">×</button>
            </div>
          )}
          
          <div className="input-group">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected}
            />
            <button 
              onClick={sendMessage}
              disabled={!isConnected || !newMessage.trim()}
              className="send-btn"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
