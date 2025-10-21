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
