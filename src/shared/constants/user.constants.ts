export const USER_CONSTANTS = {
  FIELDS: {
    USER_KEY: 'userKey',
    USER_NAME: 'userName',
    PHONE_NUMBER: 'phoneNumber',
    FULL_NAME: 'fullName',
    AVATAR: 'avatar',
  },
  VALIDATION: {
    USER_KEY_MIN_LENGTH: 8,
    USER_KEY_MAX_LENGTH: 50,
    USER_NAME_MIN_LENGTH: 2,
    USER_NAME_MAX_LENGTH: 50,
    PHONE_NUMBER_PATTERN: /^[0-9+\-\s()]+$/,
    FULL_NAME_MIN_LENGTH: 2,
    FULL_NAME_MAX_LENGTH: 100,
  },
  STATUS: {
    ONLINE: 'online',
    OFFLINE: 'offline',
  },
} as const;
