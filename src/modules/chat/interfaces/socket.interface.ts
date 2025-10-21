import { MessageType } from 'src/shared/constants/message.constants';
import { IMessageStatusEntry } from 'src/shared/constants/message-status.constants';

export interface AuthenticatedSocket {
  userKey?: string;
  userName?: string;
  phoneNumber?: string;
  fullName?: string;
  avatar?: string;
  id: string;
  handshake: {
    headers: Record<string, string>;
  };
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
  join: (room: string) => void;
}

export interface MessageWithSender {
  id: string;
  recipientKey: string;
  senderKey: string;
  content: string;
  messageType: MessageType;
  replyTo?: string;
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
    duration?: number;
  }[];
  messageStatus?: IMessageStatusEntry[];
  createdAt: Date | string;
  sender: {
    userKey: string;
    userName: string;
    avatar?: string;
  };
}

export interface ConversationInfo {
  partnerKey: string;
  lastMessage: MessageWithSender;
  messageCount: number;
  unreadCount: number;
  partner: {
    userKey: string;
    userName: string;
    avatar?: string;
    isOnline: boolean;
  } | null;
}

export interface MessageHistoryResponse {
  conversations: ConversationInfo[];
  pagination: {
    currentPage: number;
    limit: number;
    totalConversations: number;
  };
}

export interface ServiceResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

export interface FileUploadCompleteInfo {
  fileId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface NewMessageEvent {
  message: MessageWithSender;
  timestamp: Date | string;
}
