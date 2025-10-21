export interface IChatRoom {
    name: string;
    description?: string;
    user1Key: string; // User 1
    user2Key: string; // User 2
    createdBy: string; // User Key
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdById?: string;
    deletedById?: string;
    updatedById?: string;
}

import { MessageType } from 'src/shared/constants/message.constants';
import { IMessageStatusEntry } from 'src/shared/constants/message-status.constants';

export interface IChatMessage {
    recipientKey?: string; // User Key của người nhận (optional)
    senderKey: string; // User Key của người gửi
    content: string;
    messageType: MessageType;
    replyTo?: string; // Message ID being replied to
    isEdited?: boolean;
    editedAt?: Date;
    attachments?: {
        url: string;
    }[];
    messageStatus?: IMessageStatusEntry[];
    isPublished?: boolean;
    canModify?: boolean;
    publishedAt?: Date;
    modifiedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdById?: string;
    deletedById?: string;
    updatedById?: string;
}
