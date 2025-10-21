const axios = require('axios');

async function createUserA() {
  try {
    console.log('👤 Creating User A...');
    
    const userA = await axios.post('http://localhost:3000/users', {
      userKey: 'test-user-a-key',
      userName: 'TestUserA',
      phoneNumber: '+1111111113',
      fullName: 'Test User A',
      avatar: 'https://example.com/avatar-a.jpg'
    });
    console.log('✅ User A created:', userA.data);

  } catch (error) {
    console.error('❌ Error creating user A:', error.response?.data || error.message);
  }
}

createUserA();
