# Chat Socket App

A real-time chat application built with NestJS, Socket.IO, and MongoDB.

## Features

- Real-time messaging with Socket.IO
- User authentication with userKey validation
- **1-1 Private chat only** (no group chat)
- Message types: text, image, file, video
- Chunk-based file upload with progress tracking
- Online/offline status tracking
- Typing indicators
- Message replies
- Access control with publish/modify functionality
- MongoDB for data persistence
- Message history via Socket.IO (no REST API needed)
- **Modular Gateway Architecture** (separate gateways for rooms, messages, file uploads)

## Project Structure

Following the vpncn2-be project structure:

```
src/
├── base/                    # Base classes and interfaces
│   ├── entities/           # Base entity
│   ├── interfaces/         # Base interfaces
│   └── repository/         # Abstract repository
├── modules/                # Feature modules
│   ├── chat/              # Chat module with Socket.IO
│   │   ├── gateways/      # Modular gateways
│   │   │   ├── main.gateway.ts        # Main connection handler
│   │   │   ├── room.gateway.ts        # Room management
│   │   │   ├── message.gateway.ts     # Message handling
│   │   │   └── file-upload.gateway.ts # File upload handling
│   │   └── services/      # Business logic
│   └── users/             # User management module
├── repositories/           # Data access layer
├── schemas/               # MongoDB schemas
└── shared/               # Shared DTOs and constants
    ├── dtos/             # Base DTOs and paging
    ├── constants/        # Application constants
    └── config/           # Configuration
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your MongoDB connection string and JWT secret.

5. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Socket.IO Only

This application **does not provide REST API endpoints**. All communication is handled through Socket.IO connections.

## Socket.IO Events

### Client to Server Events:

**Room Management:**
- `create_private_room` - Create 1-1 private room
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room

**Messages:**
- `send_message` - Send a message
- `get_message_history` - Get message history via Socket.IO
- `modify_message` - Modify a message
- `publish_message` - Publish a message

**File Upload:**
- `upload_file_chunk` - Upload file chunk

**Typing:**
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client Events:

**Messages:**
- `new_message` - New message received
- `message_history` - Message history response
- `message_modified` - Message was modified
- `message_published` - Message was published

**Room Events:**
- `private_room_created` - Private room created
- `user_joined_room` - User joined room
- `user_left_room` - User left room

**File Upload:**
- `upload_progress` - File upload progress
- `upload_complete` - File upload completed

**Status:**
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User typing status

**System:**
- `error` - Error occurred
- `success` - Success response

## Usage

### WebSocket Connection

Connect to the main chat namespace:
```javascript
const socket = io('http://localhost:3000/chat', {
  query: {
    userKey: 'your_user_key',
    userName: 'Your Name',
    phoneNumber: '+1234567890',
    fullName: 'Your Full Name',
    avatar: 'https://example.com/avatar.jpg'
  }
});
```

### Gateway Namespaces

The application uses multiple gateway namespaces for better organization:

- `/chat` - Main connection and user status
- `/chat/rooms` - Room management (create, join, leave)
- `/chat/messages` - Message handling and typing
- `/chat/upload` - File upload functionality

### Creating Private Room

```javascript
socket.emit('create_private_room', { user2Key: 'other_user_key' });
```

### Getting Message History

```javascript
socket.emit('get_message_history', {
  roomId: 'room123',
  page: 1,
  limit: 50
});
```

### Access Control Features

The application includes access control with publish/modify functionality:

```javascript
// Modify a message
socket.emit('modify_message', {
  messageId: 'message123',
  roomId: 'room123',
  newContent: 'Updated message content'
});

// Publish a message
socket.emit('publish_message', {
  messageId: 'message123',
  roomId: 'room123'
});
```

### Listening for Events

```javascript
// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Listen for user status
socket.on('user_online', (user) => {
  console.log('User online:', user);
});
```

## Database Schema

### Users
- userKey, userName, phoneNumber, fullName
- avatar, isOnline, lastSeen

### Chat Rooms (1-1 Private Only)
- name, description
- user1Key, user2Key (two participants only)
- createdBy, lastMessage, lastMessageAt

### Chat Messages
- roomId, senderKey, content
- messageType (using MessageType constants: text/image/file/video)
- replyTo, isEdited, editedAt
- attachments (array)
- isPublished, canModify, publishedAt, modifiedAt

## Message Types

All message types are defined as constants (no hard coding):

```typescript
export const MESSAGE_CONSTANTS = {
  TYPES: {
    TEXT: 'text',
    IMAGE: 'image', 
    FILE: 'file',
    VIDEO: 'video',
  }
} as const;

export type MessageType = typeof MESSAGE_CONSTANTS.TYPES[keyof typeof MESSAGE_CONSTANTS.TYPES];
```

## Technologies Used

- **NestJS** - Backend framework
- **Socket.IO** - Real-time communication (ONLY)
- **MongoDB** - Database
- **Mongoose** - ODM
- **UserKey Validation** - Authentication
- **No REST API** - Socket.IO only architecture
- TypeScript - Programming language
- Chunk-based File Upload - File handling

## License

## API Docs & Client

- AsyncAPI spec: `docs/asyncapi.yaml` (open in https://studio.asyncapi.com)
- Postman collection (WebSocket): `docs/postman/ChatSocket.postman_collection.json`
- Postman collection (REST API): `docs/postman/UserAPI.postman_collection.json`

### REST API Endpoints

**User Management:**
- `POST /users` - Create a new user
- `GET /users/:userKey` - Get user by userKey

**Health Check:**
- `GET /health` - Application health check
- `GET /health/database` - MongoDB connection health check

**Example Create User:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "userKey": "user_1",
    "userName": "john_doe", 
    "phoneNumber": "+1234567890",
    "fullName": "John Doe",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

**Example Health Check:**
```bash
# Application health
curl -X GET http://localhost:3000/health

# Database health
curl -X GET http://localhost:3000/health/database
```

### Environment Variables for Documentation

The documentation files use environment variables for configuration:

- `HOST`: Server host (default: localhost)
- `PORT`: Server port (default: 3000) 
- `SOCKET_NAMESPACE`: Socket.IO namespace (default: /chat)

Update these variables in your `.env` files to match your deployment environment.

This project is licensed under the UNLICENSED License.
