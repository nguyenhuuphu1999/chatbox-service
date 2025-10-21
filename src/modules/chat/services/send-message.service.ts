import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { MessageType } from 'src/shared/constants/message.constants';
import { MESSAGE_STATUS, IMessageStatusEntry } from 'src/shared/constants/message-status.constants';

export interface SendMessageRequest {
  recipientKey: string;
  senderKey: string;
  content: string;
  messageType: MessageType;
  replyTo?: string;
  attachments?: {
    url: string;
  }[];
  messageStatus?: IMessageStatusEntry[];
}

export interface SendMessageResponse {
  id: string;
  recipientKey: string;
  senderKey: string;
  content: string;
  messageType: MessageType;
  replyTo?: string;
  attachments?: {
    url: string;
  }[];
  messageStatus?: IMessageStatusEntry[];
  createdAt: Date;
}

@Injectable()
export class SendMessageService {
  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly userRepository: UserRepository,
  ) { }

  public async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log('🔍 SendMessageService.sendMessage called with:', JSON.stringify(request, null, 2));

      // Note: User validation is handled in the gateway layer
      // This service assumes the user has already been validated

      // Validate reply message if provided
      if (request.replyTo) {
        console.log('🔍 Validating reply message:', request.replyTo);
        const replyMessage = await this.chatMessageRepository.findMessageById(request.replyTo);
        if (!replyMessage ||
          (replyMessage.senderKey !== request.senderKey && replyMessage.recipientKey !== request.senderKey) ||
          (replyMessage.senderKey !== request.recipientKey && replyMessage.recipientKey !== request.recipientKey)) {
          throw new BadRequestException('Invalid reply message');
        }
      }

      console.log('🔍 Creating message with data:', {
        recipientKey: request.recipientKey,
        senderKey: request.senderKey,
        content: request.content,
        messageType: request.messageType,
        replyTo: request.replyTo,
        attachments: request.attachments,
      });

      // Create the message with initial status
      const messageData = {
        recipientKey: request.recipientKey,
        senderKey: request.senderKey,
        content: request.content,
        messageType: request.messageType,
        replyTo: request.replyTo,
        attachments: request.attachments,
        messageStatus: [{
          userKey: request.senderKey,
          status: MESSAGE_STATUS.SENT,
          timestamp: new Date().toISOString()
        }]
      };

      const message = await this.chatMessageRepository.create(messageData);

      console.log('✅ Message created successfully:', message._id);

      return {
        id: message._id.toString(),
        recipientKey: message.recipientKey,
        senderKey: message.senderKey,
        content: message.content,
        messageType: message.messageType,
        replyTo: message.replyTo,
        attachments: message.attachments,
        messageStatus: message.messageStatus,
        createdAt: message.createdAt,
      };
    } catch (error) {
      console.error('❌ SendMessageService error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Something went wrong while sending message: ${error.message}`);
    }
  }
}
