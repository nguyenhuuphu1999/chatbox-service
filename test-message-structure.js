const { io } = require('socket.io-client');
const axios = require('axios');

// Test the updated message structure
async function testMessageStructure() {
  console.log('🧪 Testing updated message structure...\n');

  try {
    // Create test users if they don't exist
    console.log('👤 Ensuring test users exist...');
    
    try {
      await axios.post('http://localhost:3000/users', {
        userKey: 'user_1',
        userName: 'john_doe',
        phoneNumber: '+1111111114',
        fullName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      });
      console.log('✅ User 1 created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User 1 already exists');
      }
    }

    try {
      await axios.post('http://localhost:3000/users', {
        userKey: 'user_2',
        userName: 'jane_doe',
        phoneNumber: '+1111111115',
        fullName: 'Jane Doe',
        avatar: 'https://example.com/avatar2.jpg'
      });
      console.log('✅ User 2 created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User 2 already exists');
      }
    }

  } catch (error) {
    console.error('❌ Error creating users:', error.response?.data || error.message);
    return;
  }

  const client = io('http://localhost:3000/chat', {
    extraHeaders: {
      'user-key': 'user_1'
    }
  });

  client.on('connect', () => {
    console.log('✅ Connected to server as user_1');

    // Send a test message
    console.log('\n📤 Sending test message...');
    client.emit('send_message', {
      recipientKey: 'user_2',
      content: 'Message from user B',
      messageType: 'text',
      attachments: []
    });
  });

  client.on('new_message', (data) => {
    console.log('\n📨 Received new_message event:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verify the structure matches expected format
    if (data.message && data.timestamp) {
      console.log('\n✅ Message structure is correct!');
      console.log('📝 Message ID:', data.message.id);
      console.log('📝 Sender:', data.message.sender.userName);
      console.log('📝 Content:', data.message.content);
      console.log('📝 Message Status:', data.message.messageStatus);
      console.log('📝 Timestamp:', data.timestamp);
    } else {
      console.log('❌ Message structure is incorrect!');
    }
    
    setTimeout(() => {
      console.log('\n🏁 Test completed, closing connection...');
      client.disconnect();
    }, 1000);
  });

  client.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    process.exit(0);
  });

  // Timeout fallback
  setTimeout(() => {
    console.log('\n⏰ Test timeout, closing connection...');
    client.disconnect();
  }, 10000);
}

// Run the test
testMessageStructure().catch(console.error);
