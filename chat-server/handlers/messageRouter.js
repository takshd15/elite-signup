const {
  handleAuthentication,
  handleGetOnlineUsers,
  handleStartConversation,
  handleSendPrivateMessage,
  handleMarkMessageRead,
  handleTyping,
  handleAddReaction,
  handleRemoveReaction,
  handleEditMessage,
  handleDeleteMessage,
  handleDeleteConversation
} = require('./messageHandlers');

async function handleMessage(ws, message, clientId, clients, userConnections, conversations, sessions, metrics) {
  const { type, ...data } = message;
  
  
  switch (type) {
    case 'authenticate':
    case 'auth': // Alias for authenticate
      await handleAuthentication(ws, data, clientId, clients, userConnections, sessions, metrics);
      break;
      
    case 'get_online_users':
      await handleGetOnlineUsers(ws, data, clientId, clients, userConnections);
      break;
      
    case 'start_conversation':
      await handleStartConversation(ws, data, clientId, clients, userConnections, conversations, metrics);
      break;
      
    case 'send_private_message':
      await handleSendPrivateMessage(ws, data, clientId, clients, userConnections, conversations, metrics);
      break;
      
    case 'mark_message_read':
      await handleMarkMessageRead(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'typing':
      await handleTyping(ws, data, clientId, clients, userConnections);
      break;
      
    case 'add_reaction':
      await handleAddReaction(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'remove_reaction':
      await handleRemoveReaction(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'edit_message':
      await handleEditMessage(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'delete_message':
      await handleDeleteMessage(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'delete_conversation':
      await handleDeleteConversation(ws, data, clientId, clients, userConnections, conversations);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    case 'test':
      ws.send(JSON.stringify({ 
        type: 'test_response', 
        message: 'Server is responding to test messages',
        timestamp: Date.now() 
      }));
      break;
      
    default:
      console.warn(`Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        details: `The message type '${type}' is not supported. Supported types: authenticate, auth, get_online_users, start_conversation, send_private_message, mark_message_read, typing, add_reaction, remove_reaction, edit_message, delete_message, delete_conversation, ping, test`
      }));
  }
}

module.exports = {
  handleMessage
};
