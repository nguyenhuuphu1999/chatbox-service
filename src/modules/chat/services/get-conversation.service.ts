import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedSocket, MessageWithSender } from '../interfaces/socket.interface';
import { GetConversationDto } from '../dtos/get-conversation.dto';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { AccessControlService } from './access-control.service';

@Injectable()
export class GetConversationService {
  private readonly logger = new Logger(GetConversationService.name);

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly userRepository: UserRepository,
    private readonly accessControlService: AccessControlService,
  ) {}

  public async handleGetConversation(
    data: GetConversationDto,
    client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      // Validate partner exists
      const partner = await this.userRepository.findByUserKey(data.partnerKey);
      if (!partner) {
        this.accessControlService.publishError(this.accessControlService.server!, client.userKey, {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        });
        return;
      }

      // Get messages between current user and partner with pagination
      const { messages, total } = await this.chatMessageRepository.getMessagesBetweenUsersPaginated(
        client.userKey || '',
        data.partnerKey,
        data.page || 1,
        data.pageSize || 50
      );

      // Convert messages to MessageWithSender format (same as send message response)
      const messagesWithSender: MessageWithSender[] = await Promise.all(
        messages.map(async (message) => {
          // Get sender info (could be current user or partner)
          const sender = message.senderKey === client.userKey ?
            { userKey: client.userKey, userName: client.userName, avatar: client.avatar } :
            { userKey: partner.userKey, userName: partner.userName, avatar: partner.avatar };

          return {
            id: message._id?.toString() || message.id,
            recipientKey: message.recipientKey,
            senderKey: message.senderKey,
            content: message.content,
            messageType: message.messageType,
            replyTo: message.replyTo,
            attachments: message.attachments,
            messageStatus: message.messageStatus,
            createdAt: message.createdAt,
            sender: sender,
          };
        })
      );

      // Publish conversation messages event (same response format as send message)
      this.accessControlService.publishGetConversation(
        this.accessControlService.server!,
        client.userKey || '',
        {
          messages: messagesWithSender,
          pagination: {
            currentPage: data.page || 1,
            limit: data.pageSize || 50,
            totalMessages: total
          }
        }
      );

      this.logger.log(`Conversation messages sent to ${client.userName} with ${data.partnerKey} - ${messagesWithSender.length} messages`);
    } catch (error) {
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
    }
  }
}
