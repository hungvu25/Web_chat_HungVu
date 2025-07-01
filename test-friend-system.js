// Test script to demonstrate friend system
// Run this in browser console after logging in

const API_BASE = 'http://localhost:3001/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('token');

// Test function to create a demo friend request
async function createDemoFriendRequest() {
  try {
    // First register a test user
    const testUser = {
      firstName: 'Test',
      lastName: 'Friend',
      email: 'testfriend@example.com',
      username: 'testfriend',
      password: 'password123'
    };
    
    console.log('Creating demo user...');
    const registerResponse = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (registerResponse.ok) {
      console.log('Demo user created successfully');
    } else {
      console.log('Demo user might already exist');
    }
    
    // Now send friend request to this demo user
    console.log('Sending friend request to testfriend...');
    const friendRequestResponse = await fetch(`${API_BASE}/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ username: 'testfriend' })
    });
    
    const result = await friendRequestResponse.json();
    console.log('Friend request result:', result);
    
    if (friendRequestResponse.ok) {
      alert('Demo friend request sent! Now testfriend will receive a notification.');
    } else {
      alert(`Error: ${result.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
  }
}

// Test function to simulate receiving friend request
async function simulateReceivingFriendRequest() {
  // In a real app, this would be handled by the other user
  // But for demo, we can show how the system works
  console.log('To test receiving friend requests:');
  console.log('1. Create another account');
  console.log('2. Send friend request from that account to this one');
  console.log('3. Login back to this account to see notifications');
}

// Export functions for testing
window.testFriendSystem = {
  createDemoFriendRequest,
  simulateReceivingFriendRequest
};

console.log('Friend system test functions loaded!');
console.log('Run: testFriendSystem.createDemoFriendRequest()');
