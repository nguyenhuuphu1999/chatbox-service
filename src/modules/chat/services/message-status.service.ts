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
  ): Promise<void> {
    try {
      this.logger.log(`Handle message delivered: ${JSON.stringify(data)}`);
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
      } else {
        this.logger.error(`Message ${data.messageId} not found`);
      }
    } catch (error) {
      this.logger.error(`Message delivered error: ${JSON.stringify(error)}`);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
    }
  }

  public async handleMessageRead(
    data: MessageStatusDto,
    client: AuthenticatedSocket,
  ): Promise<void> {
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
      } else {
        this.logger.log(`Message ${data.messageId} not found`);
      }
    } catch (error) {
      this.logger.error(`Message read error: ${JSON.stringify(error)}`);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
    }
  }
}
