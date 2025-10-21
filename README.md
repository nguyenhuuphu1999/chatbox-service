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

### Collections

#### Users Collection
```typescript
{
  userKey: string,           // Unique user identifier
  userName: string,          // Display name
  phoneNumber: string,       // Unique phone number
  fullName: string,          // Full name
  avatar?: string,           // Profile picture URL
  isOnline: boolean,         // Online status
  lastSeen?: Date,           // Last activity timestamp
  createdAt: Date,           // Account creation date
  updatedAt: Date,           // Last update date
  deletedAt?: Date           // Soft delete timestamp
}
```

#### Chat Messages Collection
```typescript
{
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
  }],
  createdAt: Date,           // Message creation date
  updatedAt: Date,           // Last update date
  deletedAt?: Date           // Soft delete timestamp
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

#### Upload with JavaScript/FormData
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:3000/upload/image', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('File uploaded:', data.data.url);
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
- Verify file is accessible via URL
- Test invalid file type rejection
- Test file size limits

## 📋 API Endpoints

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create new user |
| GET | `/users/:userKey` | Get user by key |
| POST | `/upload/image` | Upload image file (jpg, png, gif, webp) |
| POST | `/upload/file` | Upload any file (images, videos, documents) |
| GET | `/health` | Application health check |
| GET | `/health/database` | Database health check |

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