const axios = require('axios');

async function createTestUsers() {
  try {
    console.log('👤 Creating test users with unique phone numbers...');
    
    // Create user A with unique phone number
    const userA = await axios.post('http://localhost:3000/users', {
      userKey: 'test-user-a-key',
      userName: 'TestUserA',
      phoneNumber: '+1111111111',
      fullName: 'Test User A',
      avatar: 'https://example.com/avatar-a.jpg'
    });
    console.log('✅ User A created:', userA.data);

    // Create user B with unique phone number
    const userB = await axios.post('http://localhost:3000/users', {
      userKey: 'test-user-b-key', 
      userName: 'TestUserB',
      phoneNumber: '+1111111112',
      fullName: 'Test User B',
      avatar: 'https://example.com/avatar-b.jpg'
    });
    console.log('✅ User B created:', userB.data);

    console.log('\n🎉 Test users created successfully!');
    console.log('User A key: test-user-a-key');
    console.log('User B key: test-user-b-key');

  } catch (error) {
    console.error('❌ Error creating users:', error.response?.data || error.message);
  }
}

createTestUsers();
