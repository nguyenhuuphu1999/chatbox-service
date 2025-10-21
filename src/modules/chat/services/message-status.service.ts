import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { AccessControlService } from './access-control.service';
import { AuthenticatedSocket, ServiceResponse } from '../interfaces/socket.interface';
import { MessageStatusDto } from '../dtos/message-status.dto';
import { MESSAGE_STATUS } from 'src/shared/constants/message-status.constants';

@Injectable()
export class MessageStatusService {
  private readonly logger = new Logger(MessageStatusService.name);

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly accessControlService: AccessControlService,
  ) {}

  public async handleMessageDelivered(
    data: MessageStatusDto,
    client: AuthenticatedSocket,
  ): Promise<ServiceResponse> {
    try {

      // Update message status to 'delivered'
      const updatedMessage = await this.chatMessageRepository.updateMessageStatus(
        data.messageId, 
        client.userKey, 
        MESSAGE_STATUS.DELIVERED
      );

      if (updatedMessage) {
        // Notify sender about delivery
        this.accessControlService.publishMessageStatusUpdate(
          this.accessControlService.server!,
          data.messageId,
          client.userKey,
          MESSAGE_STATUS.DELIVERED,
          updatedMessage.senderKey
        );

        this.logger.log(`Message ${data.messageId} delivered to ${client.userName}`);
        return { success: true };
      } else {
        this.logger.error(`Message ${data.messageId} not found`);
        return { error: 'Message not found' };
      }
    } catch (error) {
      this.logger.error('Message delivered error:', error);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async handleMessageRead(
    data: MessageStatusDto,
    client: AuthenticatedSocket,
  ): Promise<ServiceResponse> {
    try {

      // Update message status to 'read'
      const updatedMessage = await this.chatMessageRepository.updateMessageStatus(
        data.messageId, 
        client.userKey, 
        MESSAGE_STATUS.READ
      );

      if (updatedMessage) {
        // Notify sender about read
        this.accessControlService.publishMessageStatusUpdate(
          this.accessControlService.server!,
          data.messageId,
          client.userKey,
          MESSAGE_STATUS.READ,
          updatedMessage.senderKey
        );

        this.logger.log(`Message ${data.messageId} read by ${client.userName}`);
        return { success: true };
      } else {
        this.logger.log(`Message ${data.messageId} not found`);
        return { error: 'Message not found' };
      }
    } catch (error) {
      this.logger.error('Message read error:', error);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
