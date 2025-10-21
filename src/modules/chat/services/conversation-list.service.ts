import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedSocket, ConversationItem, ConversationResponse } from '../interfaces/socket.interface';
import { GetMessageHistoryDto } from '../dtos/message-history.dto';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { AccessControlService } from './access-control.service';

@Injectable()
export class ConversationListService {
  private readonly logger = new Logger(ConversationListService.name);

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly accessControlService: AccessControlService,
  ) { }

  public async handleConversationList(
    data: GetMessageHistoryDto,
    client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      this.logger.log(`Handle conversation list: ${JSON.stringify(data)}`);
      const { items, totalItems } = await this.getUserConversationsSimplified(
        client.userKey || '',
        data.page,
        data.pageSize,
      );

      const response: ConversationResponse = {
        conversations: items,
        pagination: {
          currentPage: data.page || 1,
          limit: data.pageSize || 50,
          totalConversations: totalItems,
        },
      };

      this.accessControlService.publishConversationList(
        this.accessControlService.server!,
        client.userKey || '',
        response,
      );

      this.logger.log(
        `Conversation list sent to ${client.userName} - ${items.length} conversations`,
      );
    } catch (error) {
      this.accessControlService.publishError(
        this.accessControlService.server!,
        client.userKey || '',
        error,
      );
    }
  }

  private async getUserConversationsSimplified(
    userKey: string,
    page: number,
    limit: number,
  ): Promise<{ items: ConversationItem[]; totalItems: number }> {
    try {
      const { items, total } = await this.chatMessageRepository.getConversationsByUserPaginated(
        userKey,
        page,
        limit,
      );

      const conversationItems = items.map((conversation) => ({
        recipientKey: conversation.lastMessage?.recipientKey || '',
        senderKey: conversation.lastMessage?.senderKey || '',
        content: conversation.lastMessage?.content || '',
        messageType: conversation.lastMessage?.messageType,
      }));

      return { items: conversationItems, totalItems: total };
    } catch (error) {
      this.logger.error('Error getting simplified user conversations:', error);
      return { items: [], totalItems: 0 };
    }
  }
}


