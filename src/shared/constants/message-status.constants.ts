/**
 * Message Status Constants
 * Defines the possible statuses for message tracking
 */
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

/**
 * Message Status Values
 * Array of all possible status values
 */
export const MESSAGE_STATUS_VALUES = Object.values(MESSAGE_STATUS);

/**
 * Message Status Type
 * Union type for message status values
 */
export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];

/**
 * Message Status Entry Interface
 * Defines the structure of a message status entry
 */
export interface IMessageStatusEntry {
  _id?: string;
  userKey: string;
  status: MessageStatus;
  timestamp: Date | string;
}

/**
 * Message Status Array Type
 * Array of message status entries
 */
export type MessageStatusArray = IMessageStatusEntry[];
