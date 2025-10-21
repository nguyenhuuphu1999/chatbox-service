// Lazy evaluation để đảm bảo .env được load trước khi đọc process.env
const getAppConfig = () => ({
  DATABASE: {
    URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-socket-app',
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  SERVER: {
    PORT: parseInt(process.env.PORT || '3000', 10),
    CORS: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  },
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    ALLOWED_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,application/pdf').split(','),
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '1048576', 10), // 1MB
  },
  SOCKET: {
    NAMESPACE: process.env.SOCKET_NAMESPACE || '/chat',
    PING_TIMEOUT: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
    PING_INTERVAL: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
  },
});

// Export getter để lazy evaluation
export const APP_CONFIG = new Proxy({} as ReturnType<typeof getAppConfig>, {
  get(_target, prop) {
    const config = getAppConfig();
    return config[prop as keyof typeof config];
  }
});
