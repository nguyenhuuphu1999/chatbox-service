const { io } = require('socket.io-client');

// Test validation error handling with existing users
async function testValidationError() {
  console.log('🧪 Testing validation error handling with existing users...\n');

  const client = io('http://localhost:3000/chat', {
    extraHeaders: {
      'user-key': 'test-user-a-key' // Valid user key
    }
  });

  let testCount = 0;
  const totalTests = 3;

  client.on('connect', () => {
    console.log('✅ Connected to server');

    // Test 1: Send message with invalid messageType
    console.log('\n📤 Test 1: Sending message with invalid messageType...');
    client.emit('send_message', {
      recipientKey: 'test-user-b-key',
      content: 'Hello',
      messageType: 'invalid_type', // This should trigger validation error
      attachments: []
    });
  });

  client.on('error', (error) => {
    testCount++;
    console.log(`🚨 Test ${testCount} - Received error event:`, JSON.stringify(error, null, 2));
    
    if (error.code === 'VALIDATION_ERROR') {
      console.log('✅ Validation error properly caught and sent to client!');
      console.log('📝 Error details:', error.details);
    } else {
      console.log('⚠️  Unexpected error type:', error.code);
    }

    // Run next test
    if (testCount === 1) {
      setTimeout(() => {
        console.log('\n📤 Test 2: Sending message with missing required fields...');
        client.emit('send_message', {
          // Missing recipientKey and content
          messageType: 'text'
        });
      }, 1000);
    } else if (testCount === 2) {
      setTimeout(() => {
        console.log('\n📤 Test 3: Sending typing with invalid data...');
        client.emit('typing_start', {
          // Missing recipientKey
          invalidField: 'test'
        });
      }, 1000);
    } else if (testCount === 3) {
      setTimeout(() => {
        console.log('\n🏁 All tests completed, closing connection...');
        client.disconnect();
      }, 1000);
    }
  });

  client.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    process.exit(0);
  });

  // Timeout fallback
  setTimeout(() => {
    console.log('\n⏰ Test timeout, closing connection...');
    client.disconnect();
  }, 15000);
}

// Run the test
testValidationError().catch(console.error);
