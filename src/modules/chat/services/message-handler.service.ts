import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/repositories/user.repository';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { SendMessageService } from './send-message.service';
import { AccessControlService } from './access-control.service';
import { MESSAGE_STATUS } from 'src/shared/constants/message-status.constants';
import { AuthenticatedSocket, MessageWithSender } from '../interfaces/socket.interface';
import { SendMessageDto } from '../dtos/send-message.dto';

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
    ): Promise<void> {
        this.logger.log(`Handle send message: ${JSON.stringify(data)}`);
        try {
            // Validate recipient exists
            const recipient = await this.userRepository.findByUserKey(data.recipientKey);
            if (!recipient) {
                this.accessControlService.publishError(this.accessControlService.server!, client.userKey, {
                    code: 'RECIPIENT_NOT_FOUND',
                    message: 'Recipient not found'
                });
                return;
            }

            // Don't allow sending message to yourself
            if (data.recipientKey === client.userKey) {
                this.accessControlService.publishError(this.accessControlService.server!, client.userKey, {
                    code: 'CANNOT_SEND_TO_SELF',
                    message: 'Cannot send message to yourself'
                });
                return;
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

        } catch (error) {
            this.logger.error(`Handle message error: ${JSON.stringify(error)}`);
            this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
        }
    }




}
