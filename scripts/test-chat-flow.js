#!/usr/bin/env node

/**
 * Automated Test Script for Full Chat Flow
 * Tests the complete messaging flow with publish/modify functionality
 */

const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// Test data
const USERS = {
  alice: {
    userKey: 'alice_001',
    userName: 'alice',
    phoneNumber: '+1234567890',
    fullName: 'Alice Johnson',
    avatar: 'https://example.com/alice.jpg'
  },
  bob: {
    userKey: 'bob_002',
    userName: 'bob', 
    phoneNumber: '+0987654321',
    fullName: 'Bob Smith',
    avatar: 'https://example.com/bob.jpg'
  },
  admin: {
    userKey: 'admin_003',
    userName: 'admin',
    phoneNumber: '+1111111111',
    fullName: 'Admin User',
    avatar: 'https://example.com/admin.jpg'
  }
};

class ChatFlowTester {
  constructor() {
    this.sockets = {};
    this.roomId = null;
    this.messageId = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createUser(userData) {
    try {
      const response = await axios.post(`${SERVER_URL}/users`, userData);
      this.log(`Created user: ${userData.userName}`, 'success');
      return response.data;
    } catch (error) {
      this.log(`Failed to create user ${userData.userName}: ${error.message}`, 'error');
      throw error;
    }
  }

  connectSocket(userKey, namespace = '/chat') {
    return new Promise((resolve, reject) => {
      const socket = io(`${WS_URL}${namespace}`, {
        extraHeaders: {
          'user-key': userKey
        }
      });

      socket.on('connect', () => {
        this.log(`Connected ${userKey} to ${namespace}`, 'success');
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        this.log(`Connection error for ${userKey}: ${error.message}`, 'error');
        reject(error);
      });

      // Store socket
      if (!this.sockets[userKey]) {
        this.sockets[userKey] = {};
      }
      this.sockets[userKey][namespace] = socket;
    });
  }

  async waitForEvent(socket, event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      socket.once(event, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  async testStep1_CreateUsers() {
    this.log('=== STEP 1: Creating Users ===');
    
    try {
      await this.createUser(USERS.alice);
      await this.createUser(USERS.bob);
      await this.createUser(USERS.admin);
      this.log('All users created successfully', 'success');
      return true;
    } catch (error) {
      this.log('Failed to create users', 'error');
      return false;
    }
  }

  async testStep2_ConnectSockets() {
    this.log('=== STEP 2: Connecting Sockets ===');
    
    try {
      await this.connectSocket(USERS.alice.userKey, '/chat');
      await this.connectSocket(USERS.bob.userKey, '/chat');
      await this.connectSocket(USERS.admin.userKey, '/chat');
      this.log('All sockets connected successfully', 'success');
      return true;
    } catch (error) {
      this.log('Failed to connect sockets', 'error');
      return false;
    }
  }

  async testStep3_CreateRoom() {
    this.log('=== STEP 3: Creating Private Room ===');
    
    try {
      // Connect Alice to room gateway
      const aliceRoomSocket = await this.connectSocket(USERS.alice.userKey, '/chat/rooms');
      
      // Create room
      aliceRoomSocket.emit('create_private_room', { user2Key: USERS.bob.userKey });
      
      // Wait for room created event
      const roomData = await this.waitForEvent(aliceRoomSocket, 'private_room_created');
      this.roomId = roomData.room._id;
      
      this.log(`Room created: ${this.roomId}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to create room: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep4_JoinRoom() {
    this.log('=== STEP 4: Joining Room ===');
    
    try {
      // Connect both users to room gateway
      const aliceRoomSocket = await this.connectSocket(USERS.alice.userKey, '/chat/rooms');
      const bobRoomSocket = await this.connectSocket(USERS.bob.userKey, '/chat/rooms');
      
      // Both join room
      aliceRoomSocket.emit('join_room', { roomId: this.roomId });
      bobRoomSocket.emit('join_room', { roomId: this.roomId });
      
      // Wait for join events
      await this.waitForEvent(aliceRoomSocket, 'user_joined_room');
      await this.waitForEvent(bobRoomSocket, 'user_joined_room');
      
      this.log('Both users joined room successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to join room: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep5_SendMessage() {
    this.log('=== STEP 5: Sending Regular Message ===');
    
    try {
      // Connect Alice to message gateway
      const aliceMessageSocket = await this.connectSocket(USERS.alice.userKey, '/chat/messages');
      const bobMessageSocket = await this.connectSocket(USERS.bob.userKey, '/chat/messages');
      
      // Alice sends message
      aliceMessageSocket.emit('send_message', {
        roomId: this.roomId,
        content: 'Hello Bob! How are you?',
        messageType: 'text'
      });
      
      // Wait for new message events
      const aliceResponse = await this.waitForEvent(aliceMessageSocket, 'new_message');
      const bobResponse = await this.waitForEvent(bobMessageSocket, 'new_message');
      
      this.messageId = aliceResponse.message._id;
      this.log(`Message sent and received: ${this.messageId}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to send message: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep6_SendDraftMessage() {
    this.log('=== STEP 6: Sending Draft Message ===');
    
    try {
      const aliceMessageSocket = this.sockets[USERS.alice.userKey]['/chat/messages'];
      
      // Alice sends draft message
      aliceMessageSocket.emit('send_message', {
        roomId: this.roomId,
        content: 'This is a draft message that needs admin approval',
        messageType: 'text'
      });
      
      // Wait for new message (should be draft)
      const response = await this.waitForEvent(aliceMessageSocket, 'new_message');
      
      if (!response.message.isPublished) {
        this.log('Draft message created successfully', 'success');
        return true;
      } else {
        this.log('Message was published instead of draft', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Failed to send draft message: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep7_AdminModifyMessage() {
    this.log('=== STEP 7: Admin Modifying Message ===');
    
    try {
      // Connect admin to message gateway
      const adminMessageSocket = await this.connectSocket(USERS.admin.userKey, '/chat/messages');
      const aliceMessageSocket = this.sockets[USERS.alice.userKey]['/chat/messages'];
      const bobMessageSocket = this.sockets[USERS.bob.userKey]['/chat/messages'];
      
      // Admin modifies message
      adminMessageSocket.emit('modify_message', {
        messageId: this.messageId,
        roomId: this.roomId,
        newContent: 'This message has been reviewed and approved by admin'
      });
      
      // Wait for modify events
      await this.waitForEvent(adminMessageSocket, 'message_modified');
      await this.waitForEvent(aliceMessageSocket, 'message_modified');
      await this.waitForEvent(bobMessageSocket, 'message_modified');
      
      this.log('Message modified by admin successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to modify message: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep8_AdminPublishMessage() {
    this.log('=== STEP 8: Admin Publishing Message ===');
    
    try {
      const adminMessageSocket = this.sockets[USERS.admin.userKey]['/chat/messages'];
      const aliceMessageSocket = this.sockets[USERS.alice.userKey]['/chat/messages'];
      const bobMessageSocket = this.sockets[USERS.bob.userKey]['/chat/messages'];
      
      // Admin publishes message
      adminMessageSocket.emit('publish_message', {
        messageId: this.messageId,
        roomId: this.roomId
      });
      
      // Wait for publish events
      await this.waitForEvent(adminMessageSocket, 'message_published');
      await this.waitForEvent(aliceMessageSocket, 'message_published');
      await this.waitForEvent(bobMessageSocket, 'message_published');
      
      this.log('Message published by admin successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to publish message: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep9_TypingIndicators() {
    this.log('=== STEP 9: Testing Typing Indicators ===');
    
    try {
      const aliceMessageSocket = this.sockets[USERS.alice.userKey]['/chat/messages'];
      const bobMessageSocket = this.sockets[USERS.bob.userKey]['/chat/messages'];
      
      // Alice starts typing
      aliceMessageSocket.emit('typing_start', { roomId: this.roomId });
      
      // Bob should receive typing event
      const typingStart = await this.waitForEvent(bobMessageSocket, 'user_typing');
      if (typingStart.isTyping) {
        this.log('Typing start event received', 'success');
      }
      
      // Alice stops typing
      aliceMessageSocket.emit('typing_stop', { roomId: this.roomId });
      
      // Bob should receive typing stop event
      const typingStop = await this.waitForEvent(bobMessageSocket, 'user_typing');
      if (!typingStop.isTyping) {
        this.log('Typing stop event received', 'success');
      }
      
      this.log('Typing indicators working correctly', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to test typing indicators: ${error.message}`, 'error');
      return false;
    }
  }

  async testStep10_MessageHistory() {
    this.log('=== STEP 10: Testing Message History ===');
    
    try {
      const bobMessageSocket = this.sockets[USERS.bob.userKey]['/chat/messages'];
      
      // Bob requests message history
      bobMessageSocket.emit('get_message_history', {
        roomId: this.roomId,
        page: 1,
        limit: 50
      });
      
      // Wait for message history
      const history = await this.waitForEvent(bobMessageSocket, 'message_history');
      
      if (history.messages && history.messages.length > 0) {
        this.log(`Message history retrieved: ${history.messages.length} messages`, 'success');
        return true;
      } else {
        this.log('No messages in history', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Failed to get message history: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Full Chat Flow Test', 'info');
    this.log('================================', 'info');
    
    const steps = [
      { name: 'Create Users', fn: () => this.testStep1_CreateUsers() },
      { name: 'Connect Sockets', fn: () => this.testStep2_ConnectSockets() },
      { name: 'Create Room', fn: () => this.testStep3_CreateRoom() },
      { name: 'Join Room', fn: () => this.testStep4_JoinRoom() },
      { name: 'Send Message', fn: () => this.testStep5_SendMessage() },
      { name: 'Send Draft Message', fn: () => this.testStep6_SendDraftMessage() },
      { name: 'Admin Modify Message', fn: () => this.testStep7_AdminModifyMessage() },
      { name: 'Admin Publish Message', fn: () => this.testStep8_AdminPublishMessage() },
      { name: 'Typing Indicators', fn: () => this.testStep9_TypingIndicators() },
      { name: 'Message History', fn: () => this.testStep10_MessageHistory() }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const step of steps) {
      try {
        const result = await step.fn();
        if (result) {
          passed++;
          this.testResults.push({ step: step.name, status: 'PASS' });
        } else {
          failed++;
          this.testResults.push({ step: step.name, status: 'FAIL' });
        }
      } catch (error) {
        failed++;
        this.testResults.push({ step: step.name, status: 'ERROR', error: error.message });
      }
      
      // Wait between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.log('================================', 'info');
    this.log(`🏁 Test Complete: ${passed} passed, ${failed} failed`, passed === steps.length ? 'success' : 'error');
    
    // Print detailed results
    this.log('\n📊 Detailed Results:', 'info');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      this.log(`${status} ${result.step}: ${result.status}`, result.status === 'PASS' ? 'success' : 'error');
      if (result.error) {
        this.log(`   Error: ${result.error}`, 'error');
      }
    });
    
    // Cleanup
    this.cleanup();
    
    return { passed, failed, total: steps.length };
  }

  cleanup() {
    this.log('🧹 Cleaning up connections...', 'info');
    
    Object.values(this.sockets).forEach(userSockets => {
      Object.values(userSockets).forEach(socket => {
        if (socket && socket.connected) {
          socket.disconnect();
        }
      });
    });
    
    this.log('Cleanup complete', 'success');
  }
}

// Run the test
async function main() {
  const tester = new ChatFlowTester();
  
  try {
    const results = await tester.runAllTests();
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! Chat flow is working correctly.');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${results.failed} tests failed. Please check the logs above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner crashed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ChatFlowTester;
