import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/repositories/user.repository';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { SendMessageService } from './send-message.service';
import { AccessControlService } from './access-control.service';
import { MESSAGE_STATUS } from 'src/shared/constants/message-status.constants';
import { AuthenticatedSocket, ServiceResponse, MessageHistoryResponse, ConversationInfo, MessageWithSender } from '../interfaces/socket.interface';
import { SendMessageDto } from '../dtos/send-message.dto';
import { GetMessageHistoryDto } from '../dtos/message-history.dto';

@Injectable()
export class MessageHandlerService {
    private readonly logger = new Logger(MessageHandlerService.name);

    constructor(
        private readonly sendMessageService: SendMessageService,
        private readonly accessControlService: AccessControlService,
        private readonly userRepository: UserRepository,
        private readonly chatMessageRepository: ChatMessageRepository,
    ) { }

    public async handleSendMessage(
        data: SendMessageDto,
        client: AuthenticatedSocket,
    ): Promise<ServiceResponse> {
        try {

            // Validate recipient exists
            const recipient = await this.userRepository.findByUserKey(data.recipientKey);
            if (!recipient) {
                this.accessControlService.publishError(this.accessControlService.server!, client.userKey, {
                    code: 'RECIPIENT_NOT_FOUND',
                    message: 'Recipient not found'
                });
                return { error: 'Recipient not found' };
            }

            // Don't allow sending message to yourself
            if (data.recipientKey === client.userKey) {
                this.accessControlService.publishError(this.accessControlService.server!, client.userKey, {
                    code: 'CANNOT_SEND_TO_SELF',
                    message: 'Cannot send message to yourself'
                });
                return { error: 'Cannot send message to yourself' };
            }

            const message = await this.sendMessageService.sendMessage({
                recipientKey: data.recipientKey,
                senderKey: client.userKey,
                content: data.content,
                messageType: data.messageType,
                replyTo: data.replyTo,
                attachments: data.attachments,
            });

            const messageWithSender: MessageWithSender = {
                id: message.id,
                recipientKey: message.recipientKey,
                senderKey: message.senderKey,
                content: message.content,
                messageType: message.messageType,
                replyTo: message.replyTo,
                attachments: message.attachments,
                messageStatus: message.messageStatus,
                createdAt: message.createdAt,
                sender: {
                    userKey: client.userKey,
                    userName: client.userName,
                    avatar: client.avatar,
                },
            };

            // Send to sender (confirmation)
            this.accessControlService.publishNewMessage(this.accessControlService.server!, messageWithSender, client.userKey);

            // Send to recipient
            this.accessControlService.publishNewMessage(this.accessControlService.server!, messageWithSender, data.recipientKey);

            // Update message status to 'sent' for sender
            await this.chatMessageRepository.updateMessageStatus(message.id, client.userKey, MESSAGE_STATUS.SENT);


            this.logger.log(`Message sent by ${client.userName} to ${data.recipientKey}`);
            return { success: true, data: message };

        } catch (error) {
            this.logger.error(`Handle message error: ${JSON.stringify(error)}`);
            this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    public async handleGetMessageHistory(
        data: GetMessageHistoryDto,
        client: AuthenticatedSocket,
    ): Promise<ServiceResponse<MessageHistoryResponse>> {
        try {

            // Get all conversations for this user
            const conversations = await this.getUserConversations(client.userKey, data.page || 1, data.limit || 50);

            const response: MessageHistoryResponse = {
                conversations: conversations,
                pagination: {
                    currentPage: data.page || 1,
                    limit: data.limit || 50,
                    totalConversations: conversations.length
                }
            };

            // Publish message history event
            this.accessControlService.publishMessageHistory(this.accessControlService.server!, client.userKey, response);


            this.logger.log(`Message history sent to ${client.userName} - ${conversations.length} conversations`);
            return { success: true, data: response };
        } catch (error) {
            this.accessControlService.publishError(this.accessControlService.server, client.userKey || '', error);
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    // Helper method to get user conversations
  private async getUserConversations(userKey: string, page: number, limit: number): Promise<ConversationInfo[]> {
    try {
      const { items, total } = await this.chatMessageRepository.getConversationsByUserPaginated(userKey, page, limit);

      const conversationsWithUserInfo = await Promise.all(
        items.map(async (conversation) => {
          const partner = await this.userRepository.findByUserKey(conversation.partnerKey);
          
          // Create full MessageWithSender structure for lastMessage
          const lastMessage: MessageWithSender = {
            id: conversation.lastMessage?._id?.toString?.() ?? conversation.lastMessage?.id,
            recipientKey: conversation.lastMessage?.recipientKey,
            senderKey: conversation.lastMessage?.senderKey,
            content: conversation.lastMessage?.content,
            messageType: conversation.lastMessage?.messageType,
            replyTo: conversation.lastMessage?.replyTo,
            attachments: conversation.lastMessage?.attachments,
            messageStatus: conversation.lastMessage?.messageStatus,
            createdAt: conversation.lastMessage?.createdAt,
            sender: {
              userKey: conversation.lastMessage?.senderKey,
              userName: partner?.userName || 'Unknown',
              avatar: partner?.avatar,
            },
          };

          return {
            partnerKey: conversation.partnerKey,
            lastMessage: lastMessage,
            messageCount: conversation.messageCount,
            unreadCount: conversation.unreadCount,
            partner: partner ? {
              userKey: partner.userKey,
              userName: partner.userName,
              avatar: partner.avatar,
              isOnline: partner.isOnline
            } : null
          } as ConversationInfo;
        })
      );

      return conversationsWithUserInfo;
    } catch (error) {
      this.logger.error('Error getting user conversations:', error);
      return [];
    }
  }

}
