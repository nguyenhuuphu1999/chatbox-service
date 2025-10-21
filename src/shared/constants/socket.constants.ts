export const SOCKET_EVENTS = {
  CLIENT_TO_SERVER: {
    // Messages
    SEND_MESSAGE: 'send_message',
    GET_MESSAGE_HISTORY: 'get_message_history',
    
    // File upload
    UPLOAD_FILE_CHUNK: 'upload_file_chunk',
    
    // Typing
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    
    // Message status
    MESSAGE_DELIVERED: 'message_delivered',
    MESSAGE_READ: 'message_read',
  },
  SERVER_TO_CLIENT: {
    // Messages
    NEW_MESSAGE: 'new_message',
    MESSAGE_HISTORY: 'message_history',
    MESSAGE_STATUS_UPDATE: 'message_status_update',
    
    // File upload
    UPLOAD_PROGRESS: 'upload_progress',
    UPLOAD_COMPLETE: 'upload_complete',
    
    // Status
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    USER_TYPING: 'user_typing',
    
    // Error/Success
    ERROR: 'error',
    SUCCESS: 'success',
  },
} as const;
