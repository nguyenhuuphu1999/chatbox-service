// Client Example - Cách sử dụng Socket.IO với Chat App
const io = require('socket.io-client');

// Kết nối đến Socket.IO server
const socket = io('http://localhost:3000/chat', {
  query: {
    userKey: 'user123',
    userName: 'John Doe',
    phoneNumber: '+1234567890',
    fullName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  }
});

// Event listeners
socket.on('connect', () => {
  console.log('Connected to server');
  
  // Join a room
  socket.emit('join_room', { roomId: 'room123' });
  
  // Get message history
  socket.emit('get_message_history', {
    roomId: 'room123',
    page: 1,
    limit: 50
  });
});

socket.on('message_history', (data) => {
  console.log('Message history received:', data);
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});

socket.on('upload_progress', (data) => {
  console.log(`Upload progress: ${data.progress}%`);
});

socket.on('upload_complete', (data) => {
  console.log('Upload complete:', data.url);
  
  // Send message with uploaded file
  socket.emit('send_message', {
    roomId: 'room123',
    content: 'Check out this file!',
    messageType: 'file',
    attachments: [{
      url: data.url,
      type: data.fileType,
      name: data.fileName,
      size: data.fileSize
    }]
  });
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Function to upload file with chunks
function uploadFile(file) {
  const fileId = generateUUID();
  const chunkSize = 1024 * 1024; // 1MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  console.log(`Uploading file: ${file.name}, ${totalChunks} chunks`);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const reader = new FileReader();
    reader.onload = function() {
      const chunkData = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
      
      socket.emit('upload_file_chunk', {
        fileId: fileId,
        chunkIndex: i,
        totalChunks: totalChunks,
        chunkData: chunkData,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
    };
    reader.readAsDataURL(chunk);
  }
}

// Function to send text message
function sendTextMessage(content) {
  socket.emit('send_message', {
    roomId: 'room123',
    content: content,
    messageType: 'text'
  });
}

// Function to generate UUID (simple version)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Example usage
setTimeout(() => {
  sendTextMessage('Hello World!');
}, 2000);

// Uncomment to test file upload (requires file input)
// const fileInput = document.getElementById('fileInput');
// fileInput.addEventListener('change', (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     uploadFile(file);
//   }
// });

