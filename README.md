# ChatBox Service

A real-time chat service built with NestJS, Socket.IO, and MongoDB. This service provides instant messaging capabilities with file upload support, message status tracking, and user presence management.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **File Upload**: Support for image, video, and document uploads with chunked transfer
- **Message Status**: Track sent, delivered, and read status for messages
- **User Presence**: Online/offline status and last seen tracking
- **Typing Indicators**: Real-time typing status notifications
- **Message History**: Paginated conversation history and message retrieval
- **User Management**: User registration and profile management
- **Health Monitoring**: Application and database health checks

## 🏗️ Architecture

### Tech Stack

- **Backend**: NestJS (Node.js framework)
- **Real-time**: Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Validation**: class-validator & class-transformer
- **File Upload**: Multer with chunked transfer
- **Containerization**: Docker & Docker Compose

### Project Structure

```
src/
├── base/                    # Base entities and repositories
├── modules/
│   ├── chat/               # Chat functionality
│   │   ├── dtos/           # Data Transfer Objects
│   │   ├── filters/        # Exception filters
│   │   ├── gateways/       # Socket.IO gateways
│   │   ├── interceptors/   # Request/response interceptors
│   │   ├── interfaces/     # TypeScript interfaces
│   │   └── services/       # Business logic services
│   ├── health/             # Health check endpoints
│   └── users/              # User management
├── repositories/           # Data access layer
├── schemas/               # MongoDB schemas
└── shared/                # Shared constants and utilities
```

## 🗄️ Database Design

### Base Entity
All entities extend from `BaseEntity` which provides common fields:

```typescript
{
  createdAt: Date,           // Auto-generated creation timestamp
  updatedAt: Date,           // Auto-updated modification timestamp
  deletedAt?: Date,          // Soft delete timestamp
  createdById?: string,      // User ID who created the record
  updatedById?: string,      // User ID who last updated the record
  deletedById?: string       // User ID who deleted the record
}
```

### Collections

#### Users Collection
```typescript
{
  // Base Entity fields
  createdAt: Date,           // Account creation date
  updatedAt: Date,           // Last update date
  deletedAt?: Date,          // Soft delete timestamp
  createdById?: string,      // User ID who created the account
  updatedById?: string,      // User ID who last updated the account
  deletedById?: string,      // User ID who deleted the account
  
  // User specific fields
  userKey: string,           // Unique user identifier
  userName: string,          // Display name
  phoneNumber: string,       // Unique phone number
  fullName: string,          // Full name
  avatar?: string,           // Profile picture URL
  isOnline: boolean,         // Online status
  lastSeen?: Date            // Last activity timestamp
}
```

#### Chat Messages Collection
```typescript
{
  // Base Entity fields
  createdAt: Date,           // Message creation date
  updatedAt: Date,           // Last update date
  deletedAt?: Date,          // Soft delete timestamp
  createdById?: string,      // User ID who created the message
  updatedById?: string,      // User ID who last updated the message
  deletedById?: string,      // User ID who deleted the message
  
  // Message specific fields
  recipientKey?: string,     // Message recipient
  senderKey: string,         // Message sender
  content: string,           // Message content
  messageType: MessageType,  // 'text' | 'image' | 'file' | 'video'
  replyTo?: string,          // Reply to message ID
  isEdited: boolean,         // Edit status
  editedAt?: Date,           // Edit timestamp
  attachments?: [{           // File attachments
    url: string
  }],
  messageStatus?: [{         // Message status tracking
    userKey: string,
    status: 'sent' | 'delivered' | 'read',
    timestamp: Date
  }]
}
```


## 📡 Socket.IO Events

### Client to Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `send_message` | Send a new message | `SendMessageDto` |
| `conversation_list` | Get conversation list | `GetMessageHistoryDto` |
| `get_conversation` | Get messages with specific user | `GetConversationDto` |
| `upload_file_chunk` | Upload file chunk | `UploadFileChunkDto` |
| `typing_start` | Start typing indicator | `TypingDto` |
| `typing_stop` | Stop typing indicator | `TypingDto` |
| `message_delivered` | Mark message as delivered | `MessageStatusDto` |
| `message_read` | Mark message as read | `MessageStatusDto` |

### Server to Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `new_message` | New message received | `NewMessageEvent` |
| `conversation_list` | Conversation list response | `ConversationResponse` |
| `get_conversation` | Conversation messages | `PartnerMessagesResponse` |
| `message_status_update` | Message status update | `MessageStatusUpdateEvent` |
| `upload_progress` | File upload progress | `UploadProgressEvent` |
| `upload_complete` | File upload complete | `UploadCompleteEvent` |
| `user_online` | User came online | `UserPresenceEvent` |
| `user_offline` | User went offline | `UserPresenceEvent` |
| `user_typing` | User typing indicator | `TypingEvent` |
| `error` | Error occurred | `ErrorResponse` |
| `success` | Success response | `SuccessResponse` |

## 🔧 Installation & Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB >= 7.0
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatbox-service
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker-compose up -d mongodb
   
   # Or start MongoDB locally
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   pnpm run start:dev
   
   # Production mode
   pnpm run build
   pnpm run start:prod
   ```

### Docker Deployment

1. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f chat-app
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 🧪 Testing

### Automated Testing

#### Unit Tests
```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run tests in debug mode
pnpm run test:debug
```

#### End-to-End Tests
```bash
# Run e2e tests
pnpm run test:e2e
```

### Manual Testing with Postman Collections

The project includes comprehensive Postman collections for testing:

1. **Import Collections**
   - Import `docs/postman/UserAPI.postman_collection.json` for REST API testing
   - Import `docs/postman/ChatSocket.postman_collection.json` for WebSocket testing

2. **Set Environment Variables**
   ```
   baseUrl: http://localhost:3000
   userKey: user_1
   host: localhost
   port: 3000
   socketNamespace: /chat
   ```

3. **Test REST APIs**
   - Create User
   - Get User
   - Health Checks
   - File Upload

4. **Test WebSocket Connections**
   - Connect to `/chat` namespace
   - Send Socket.IO events using the provided frame examples
   - Test real-time messaging, file upload, and user presence

### 📡 Socket.IO Testing with Postman

> 📖 **Detailed Guide:** [POSTMAN_SOCKET_TESTING.md](docs/POSTMAN_SOCKET_TESTING.md)

#### Step 1: Import Collection
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `docs/postman/ChatSocket.postman_collection.json`
4. Collection "Chat Socket API" will appear

#### Step 2: Create Environment
1. Click **Environments** → **Create Environment**
2. Name: `ChatBox Local`
3. Add variables:
   ```
   host: localhost
   port: 3000
   socketNamespace: /chat
   userKey: user_1
   userName: John Doe
   phoneNumber: +1234567890
   fullName: John Doe
   avatar: https://example.com/avatar.jpg
   roomId: room_123
   ```
4. Save environment

#### Step 3: Connect WebSocket
1. Select request **"Connect /chat (Socket.IO handshake)"**
2. Ensure `ChatBox Local` environment is selected
3. Click **Connect**
4. In **Messages** tab, you'll see successful connection

#### Step 4: Send Socket.IO Events
After successful connection, in **Messages** tab, send these frames:

**🔵 Connection and Authentication:**
```
42["join_room", {"roomId": "{{roomId}}"}]
```

**💬 Send Message:**
```
42["send_message", {
  "recipientKey": "user_2",
  "content": "Hello from Postman!",
  "messageType": "text"
}]
```

**📁 Upload File (chunked):**
```
42["upload_file_chunk", {
  "fileId": "file_123",
  "chunkIndex": 0,
  "totalChunks": 1,
  "chunkData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "fileName": "test.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024
}]
```

**⌨️ Typing Indicators:**
```
42["typing_start", {"recipientKey": "user_2"}]
42["typing_stop", {"recipientKey": "user_2"}]
```

**📊 Message Status:**
```
42["message_delivered", {"messageId": "msg_123"}]
42["message_read", {"messageId": "msg_123"}]
```

**📋 Get Message History:**
```
42["conversation_list", {
  "page": 1,
  "limit": 20
}]
```

**👥 Get Messages with Specific User:**
```
42["get_conversation", {
  "recipientKey": "user_2",
  "page": 1,
  "limit": 20
}]
```

#### Step 5: Listen for Server Events
In **Messages** tab, you'll receive these response events:

**🟢 New Message:**
```
42["new_message", {
  "message": {
    "id": "msg_123",
    "senderKey": "user_2",
    "content": "Hello back!",
    "messageType": "text",
    "createdAt": "2025-01-21T10:30:00.000Z"
  },
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

**📁 Upload Progress:**
```
42["upload_progress", {
  "fileId": "file_123",
  "progress": 50,
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

**✅ Upload Complete:**
```
42["upload_complete", {
  "fileId": "file_123",
  "url": "/uploads/file_123.jpg",
  "fileName": "test.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024,
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

**👤 User Presence:**
```
42["user_online", {
  "userKey": "user_2",
  "userName": "Jane Doe",
  "isOnline": true,
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

**⌨️ Typing Indicator:**
```
42["user_typing", {
  "userKey": "user_2",
  "userName": "Jane Doe",
  "isTyping": true,
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

**❌ Error Response:**
```
42["error", {
  "code": "INVALID_MESSAGE",
  "message": "Message content is required",
  "details": null,
  "timestamp": "2025-01-21T10:30:00.000Z"
}]
```

#### Step 6: Test Scenarios

**Scenario 1: Basic Chat Flow**
1. Connect 2 WebSocket clients (2 Postman tabs)
2. Send message from client 1 → client 2
3. Verify client 2 receives `new_message` event
4. Send reply from client 2 → client 1

**Scenario 2: Typing Indicators**
1. Connect 2 WebSocket clients
2. Client 1 sends `typing_start`
3. Verify client 2 receives `user_typing` event
4. Client 1 sends `typing_stop`
5. Verify client 2 receives `user_typing` with `isTyping: false`

**Scenario 3: Message Status**
1. Send message
2. Send `message_delivered` event
3. Send `message_read` event
4. Verify status is updated

**Scenario 4: Message History**
1. Connect WebSocket client
2. Send `conversation_list` to get all conversations
3. Verify receiving conversation list with pagination
4. Send `get_conversation` with specific `recipientKey`
5. Verify receiving messages with specific user
6. Test pagination by changing `page` and `limit` parameters

#### 🔧 Troubleshooting

**Connection Failed:**
- Check server running on port 3000
- Verify environment variables are correct
- Check headers include `user-key`

**Not Receiving Events:**
- Ensure joined room before sending messages
- Check `recipientKey` exists
- Verify message format is correct

**Upload Failed:**
- Check file size < 50MB
- Verify file type is supported
- Check base64 encoding format is correct

### Manual Testing with Socket.IO Client

1. **Connect to the service**
   ```javascript
   const io = require('socket.io-client');
   
   const socket = io('http://localhost:3000/chat', {
     extraHeaders: {
       'user-key': 'user_1',
       'user-name': 'User 1',
       'avatar': 'avatar1.jpg'
     }
   });
   ```

2. **Send a message**
   ```javascript
   socket.emit('send_message', {
     recipientKey: 'user_2',
     content: 'Hello World!',
     messageType: 'text'
   });
   ```

3. **Listen for responses**
   ```javascript
   socket.on('new_message', (data) => {
     console.log('New message:', data);
   });
   
   socket.on('error', (error) => {
     console.error('Error:', error);
   });
   ```

### API Testing

#### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "userKey": "user_1",
    "userName": "User 1",
    "phoneNumber": "1234567890",
    "fullName": "User One"
  }'
```

#### Get User
```bash
curl http://localhost:3000/users/user_1
```

#### Health Check
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/database
```

#### Upload Image
```bash
curl -X POST http://localhost:3000/upload/image \
  -F "image=@/path/to/your/image.jpg"
```

#### Upload File
```bash
curl -X POST http://localhost:3000/upload/file \
  -F "file=@/path/to/your/file.pdf"
```

#### Upload Video
```bash
curl -X POST http://localhost:3000/upload/video \
  -F "video=@/path/to/your/video.mp4"
```

#### Upload with JavaScript/FormData
```javascript
// Upload Image
const imageFormData = new FormData();
imageFormData.append('image', fileInput.files[0]);

fetch('http://localhost:3000/upload/image', {
  method: 'POST',
  body: imageFormData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Image uploaded:', data.data.url);
  } else {
    console.error('Upload failed:', data.error);
  }
});

// Upload Video
const videoFormData = new FormData();
videoFormData.append('video', videoInput.files[0]);

fetch('http://localhost:3000/upload/video', {
  method: 'POST',
  body: videoFormData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Video uploaded:', data.data.url);
  } else {
    console.error('Upload failed:', data.error);
  }
});
```

### Test Scenarios

#### 1. Basic Messaging
- Create two users
- Connect both users via Socket.IO
- Send messages between users
- Verify message delivery and status updates

#### 2. File Upload
- Send image/video message with attachments
- Verify file upload progress
- Check file completion notification

#### 3. Message Status
- Send message and verify 'sent' status
- Mark as 'delivered' and verify update
- Mark as 'read' and verify final status

#### 4. User Presence
- Connect user and verify 'online' status
- Disconnect user and verify 'offline' status
- Check 'lastSeen' timestamp updates

#### 5. Typing Indicators
- Start typing and verify indicator sent
- Stop typing and verify indicator cleared

#### 6. File Upload API
- Upload image file via REST API
- Upload document file via REST API
- Upload video file via REST API
- Verify file is accessible via URL
- Test invalid file type rejection
- Test file size limits

## 📋 API Endpoints

### REST Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/users` | Create new user | `{ userKey, userName, phoneNumber, fullName, avatar? }` |
| GET | `/users/:userKey` | Get user by key | - |
| POST | `/upload/image` | Upload image file (jpg, png, gif, webp) | `FormData: { image: File }` |
| POST | `/upload/file` | Upload any file (images, documents) | `FormData: { file: File }` |
| POST | `/upload/video` | Upload video file (mp4, webm, ogg) | `FormData: { video: File }` |
| GET | `/health` | Application health check | - |
| GET | `/health/database` | Database health check | - |

#### File Upload Details

**Image Upload** (`/upload/image`):
- **Supported formats**: JPG, PNG, GIF, WebP
- **Max size**: 50MB (configurable)
- **Response**: `{ success: boolean, data: { url: string }, error?: string }`

**File Upload** (`/upload/file`):
- **Supported formats**: Images, PDF, Documents
- **Max size**: 50MB (configurable)
- **Response**: `{ success: boolean, data: { url: string }, error?: string }`

**Video Upload** (`/upload/video`):
- **Supported formats**: MP4, WebM, OGG, AVI, MOV, WMV, FLV
- **Max size**: 100MB (configurable)
- **Response**: `{ success: boolean, data: { url: string }, error?: string }`
- **Streaming**: Supports 1MB chunked uploads for large videos

### Socket.IO Namespaces

- **Chat**: `/chat` - Main chat functionality
- **Upload**: `/chat/upload` - File upload handling

## 🔒 Security Features

- **Input Validation**: All inputs validated using class-validator
- **Authentication**: User authentication via headers
- **Rate Limiting**: Built-in rate limiting for file uploads
- **File Type Validation**: Restricted file types for uploads
- **Size Limits**: Maximum file size enforcement
- **CORS**: Configurable CORS settings

## 📊 Monitoring & Logging

- **Health Checks**: Application and database health monitoring
- **Structured Logging**: Comprehensive logging with different levels
- **Error Tracking**: Detailed error logging and reporting
- **Performance Metrics**: Request timing and performance tracking

## 🚀 Deployment

### Environment Variables

```bash
NODE_ENV=production
HOST=localhost
MONGODB_URI=mongodb://admin:password123@mongodb:27017/chat-socket-app?authSource=admin
PORT=3000
CORS_ORIGIN=*
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/*,video/*,application/pdf
UPLOAD_PATH=./uploads
CHUNK_SIZE=1048576
SOCKET_NAMESPACE=/chat
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

### Production Considerations

- Use environment-specific configuration files
- Set up proper MongoDB authentication
- Configure reverse proxy (nginx) for production
- Set up SSL/TLS certificates
- Implement proper backup strategies
- Monitor application performance and logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request