export const MESSAGE_CONSTANTS = {
  TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    VIDEO: 'video',
  },
  VALIDATION: {
    CONTENT_MAX_LENGTH: 1000,
    MAX_ATTACHMENTS: 5,
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  },
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_FILE_TYPES: ['application/pdf', 'application/msword', 'text/plain'],
} as const;

export type MessageType = 'text' | 'image' | 'file' | 'video';
