const axios = require('axios');

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Try to get user A
    try {
      const userA = await axios.get('http://localhost:3000/users/user-a-key');
      console.log('✅ User A exists:', userA.data);
    } catch (error) {
      console.log('❌ User A not found:', error.response?.data || error.message);
    }

    // Try to get user B  
    try {
      const userB = await axios.get('http://localhost:3000/users/user-b-key');
      console.log('✅ User B exists:', userB.data);
    } catch (error) {
      console.log('❌ User B not found:', error.response?.data || error.message);
    }

    // Try to get user with different key
    try {
      const userTest = await axios.get('http://localhost:3000/users/test-user-key');
      console.log('✅ Test user exists:', userTest.data);
    } catch (error) {
      console.log('❌ Test user not found:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers();
