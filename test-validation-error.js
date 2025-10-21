const { io } = require('socket.io-client');

// Test validation error handling
async function testValidationError() {
  console.log('🧪 Testing validation error handling...\n');

  const client = io('http://localhost:3000/chat', {
    extraHeaders: {
      'user-key': 'user-a-key' // Valid user key
    }
  });

  client.on('connect', () => {
    console.log('✅ Connected to server');

    // Test 1: Send message with invalid messageType
    console.log('\n📤 Test 1: Sending message with invalid messageType...');
    client.emit('send_message', {
      recipientKey: 'user-b-key',
      content: 'Hello',
      messageType: 'invalid_type', // This should trigger validation error
      attachments: []
    });
  });

  client.on('error', (error) => {
    console.log('🚨 Received error event:', JSON.stringify(error, null, 2));
    
    if (error.code === 'VALIDATION_ERROR') {
      console.log('✅ Validation error properly caught and sent to client!');
      console.log('📝 Error details:', error.details);
    }
  });

  client.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    process.exit(0);
  });

  // Test 2: Send message with missing required fields
  setTimeout(() => {
    console.log('\n📤 Test 2: Sending message with missing required fields...');
    client.emit('send_message', {
      // Missing recipientKey and content
      messageType: 'text'
    });
  }, 2000);

  // Test 3: Send typing with invalid data
  setTimeout(() => {
    console.log('\n📤 Test 3: Sending typing with invalid data...');
    client.emit('typing_start', {
      // Missing recipientKey
      invalidField: 'test'
    });
  }, 4000);

  // Close connection after tests
  setTimeout(() => {
    console.log('\n🏁 Tests completed, closing connection...');
    client.disconnect();
  }, 6000);
}

// Run the test
testValidationError().catch(console.error);
