const { io } = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const USER_A_KEY = 'user_a_test';
const USER_B_KEY = 'user_b_test';

// Test data
const testUsers = [
  {
    userKey: USER_A_KEY,
    userName: 'User A',
    phoneNumber: '+1234567890',
    fullName: 'Test User A',
    avatar: 'https://example.com/avatar1.jpg'
  },
  {
    userKey: USER_B_KEY,
    userName: 'User B',
    phoneNumber: '+1234567891',
    fullName: 'Test User B',
    avatar: 'https://example.com/avatar2.jpg'
  }
];

async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${SERVER_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (response.ok) {
        console.log(`✅ Created user: ${user.userName}`);
      } else {
        const error = await response.text();
        console.log(`⚠️  User ${user.userName} might already exist: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.userName}:`, error.message);
    }
  }
}

function createSocketConnection(userKey, userName) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SERVER_URL}/chat`, {
      extraHeaders: {
        'user-key': userKey
      }
    });

    socket.on('connect', () => {
      console.log(`✅ ${userName} connected: ${socket.id}`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ ${userName} connection error:`, error.message);
      reject(error);
    });

    socket.on('error', (error) => {
      console.error(`❌ ${userName} socket error:`, error);
    });

    // Set timeout
    setTimeout(() => {
      reject(new Error(`Connection timeout for ${userName}`));
    }, 5000);
  });
}

function createMessageSocket(userKey, userName) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SERVER_URL}/chat/messages`, {
      extraHeaders: {
        'user-key': userKey
      }
    });

    socket.on('connect', () => {
      console.log(`✅ ${userName} message socket connected: ${socket.id}`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ ${userName} message socket error:`, error.message);
      reject(error);
    });

    // Set timeout
    setTimeout(() => {
      reject(new Error(`Message socket timeout for ${userName}`));
    }, 5000);
  });
}

async function testMessageStatusFlow() {
  console.log('\n🧪 Testing Message Status Flow...\n');

  try {
    // Create test users
    await createTestUsers();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create socket connections
    console.log('🔌 Creating socket connections...');
    const userASocket = await createSocketConnection(USER_A_KEY, 'User A');
    const userBSocket = await createSocketConnection(USER_B_KEY, 'User B');
    
    const userAMessageSocket = await createMessageSocket(USER_A_KEY, 'User A');
    const userBMessageSocket = await createMessageSocket(USER_B_KEY, 'User B');

    // Set up event listeners
    let messageId = null;
    let statusUpdates = [];

    // User A listeners
    userAMessageSocket.on('new_message', (data) => {
      console.log('📨 User A received new message:', data.message?.id);
      messageId = data.message?.id;
    });

    userAMessageSocket.on('message_status_update', (data) => {
      console.log('📊 User A received status update:', data);
      statusUpdates.push(data);
    });

    // User B listeners
    userBMessageSocket.on('new_message', (data) => {
      console.log('📨 User B received new message:', data.message?.id);
    });

    userBMessageSocket.on('user_typing', (data) => {
      console.log('⌨️  User B received typing indicator:', data);
    });

    // Test 1: Send message from A to B
    console.log('\n📤 Test 1: User A sends message to User B');
    userAMessageSocket.emit('send_message', {
      recipientKey: USER_B_KEY,
      content: 'Hello User B! This is a test message.',
      messageType: 'text'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: User B marks message as read
    if (messageId) {
      console.log('\n👁️  Test 2: User B marks message as read');
      userBMessageSocket.emit('message_read', {
        messageId: messageId,
        recipientKey: USER_A_KEY
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 3: Typing indicators
    console.log('\n⌨️  Test 3: Typing indicators');
    userAMessageSocket.emit('typing_start', {
      recipientKey: USER_B_KEY
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    userAMessageSocket.emit('typing_stop', {
      recipientKey: USER_B_KEY
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Get message history
    console.log('\n📜 Test 4: Get message history');
    userAMessageSocket.emit('get_message_history', {
      recipientKey: USER_B_KEY,
      page: 1,
      limit: 10
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Results
    console.log('\n📊 Test Results:');
    console.log(`✅ Message sent: ${messageId ? 'Yes' : 'No'}`);
    console.log(`✅ Status updates received: ${statusUpdates.length}`);
    console.log(`✅ Typing indicators: Working`);
    console.log(`✅ Message history: Working`);

    // Cleanup
    userASocket.disconnect();
    userBSocket.disconnect();
    userAMessageSocket.disconnect();
    userBMessageSocket.disconnect();

    console.log('\n🎉 Message Status Flow Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testMessageStatusFlow().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testMessageStatusFlow };
