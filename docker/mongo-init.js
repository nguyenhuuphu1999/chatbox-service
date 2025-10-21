// MongoDB initialization script
db = db.getSiblingDB('chat-socket-app');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userKey', 'userName', 'phoneNumber', 'fullName'],
      properties: {
        userKey: { bsonType: 'string' },
        userName: { bsonType: 'string' },
        phoneNumber: { bsonType: 'string' },
        fullName: { bsonType: 'string' },
        avatar: { bsonType: 'string' },
        isOnline: { bsonType: 'bool' },
        lastSeen: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('chatRooms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'user1Key', 'user2Key', 'createdBy'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        user1Key: { bsonType: 'string' },
        user2Key: { bsonType: 'string' },
        createdBy: { bsonType: 'string' },
        lastMessage: { bsonType: 'string' },
        lastMessageAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('chatMessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId', 'senderKey', 'content', 'messageType'],
      properties: {
        roomId: { bsonType: 'string' },
        senderKey: { bsonType: 'string' },
        content: { bsonType: 'string' },
        messageType: { 
          bsonType: 'string',
          enum: ['text', 'image', 'file', 'video']
        },
        replyTo: { bsonType: 'string' },
        isEdited: { bsonType: 'bool' },
        editedAt: { bsonType: 'date' },
        attachments: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['url', 'type', 'name', 'size'],
            properties: {
              url: { bsonType: 'string' },
              type: { bsonType: 'string' },
              name: { bsonType: 'string' },
              size: { bsonType: 'number' },
              duration: { bsonType: 'number' }
            }
          }
        },
        isPublished: { bsonType: 'bool' },
        canModify: { bsonType: 'bool' },
        publishedAt: { bsonType: 'date' },
        modifiedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ userKey: 1 }, { unique: true });
db.users.createIndex({ phoneNumber: 1 }, { unique: true });
db.users.createIndex({ isOnline: 1 });

db.chatRooms.createIndex({ user1Key: 1, user2Key: 1 });
db.chatRooms.createIndex({ createdBy: 1 });
db.chatRooms.createIndex({ lastMessageAt: -1 });

db.chatMessages.createIndex({ roomId: 1, createdAt: -1 });
db.chatMessages.createIndex({ senderKey: 1 });
db.chatMessages.createIndex({ messageType: 1 });

print('Database initialization completed successfully!');

