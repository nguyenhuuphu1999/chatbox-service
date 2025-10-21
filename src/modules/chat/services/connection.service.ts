import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/repositories/user.repository';
import { ChatMessageRepository } from 'src/repositories/chat-message.repository';
import { AccessControlService } from './access-control.service';
import { SOCKET_EVENTS, ERROR_CODES } from 'src/shared/constants';
import { MESSAGE_STATUS } from 'src/shared/constants/message-status.constants';
import { AuthenticatedSocket } from '../interfaces/socket.interface';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);
  private connectedUsers = new Map<string, string>(); // userKey -> socketId

  constructor(
    private readonly userRepository: UserRepository,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly accessControlService: AccessControlService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);
    
    try {
      // Get userKey from headers
      const headers = client.handshake.headers;
      const userKey = headers['user-key'] as string;
      
      // Validate userKey exists
      if (!userKey) {
        client.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, {
          code: ERROR_CODES.SOCKET.INVALID_CONNECTION_DATA,
          message: 'user-key header is required',
        });
        client.disconnect();
        return;
      }

      // Check if user exists in database
      const existingUser = await this.userRepository.findByUserKey(userKey);
      if (!existingUser) {
        client.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, {
          code: ERROR_CODES.USER.NOT_FOUND,
          message: 'User not found',
        });
        client.disconnect();
        return;
      }

      // Store user data in socket
      client.userKey = userKey;
      client.userName = existingUser.userName;
      client.phoneNumber = existingUser.phoneNumber;
      client.fullName = existingUser.fullName;
      client.avatar = existingUser.avatar;

      this.connectedUsers.set(userKey, client.id);

      // Update user online status
      await this.userRepository.updateOnlineStatus(existingUser._id.toString(), true);

      // Join user to their personal room for direct messaging
      client.join(`user_${userKey}`);

      // Auto-mark all undelivered messages as delivered when user connects
      await this.markMessagesAsDelivered(userKey);

      // Notify user is online (server will be set by gateway)
      if (this.accessControlService.server) {
        this.accessControlService.publishUserOnline(
          this.accessControlService.server,
          userKey,
          existingUser.userName
        );
      }


      this.logger.log(`User ${existingUser.userName} (${userKey}) connected successfully`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, {
        code: ERROR_CODES.SYSTEM.SOMETHING_WENT_WRONG,
        message: 'Connection failed',
      });
      client.disconnect();
    }
  }

  async handleDisconnection(client: AuthenticatedSocket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    if (client.userKey) {
      this.connectedUsers.delete(client.userKey);

      // Update user offline status
      const user = await this.userRepository.findByUserKey(client.userKey);
      if (user) {
        await this.userRepository.updateOnlineStatus(user._id.toString(), false);
      }

      // Notify user is offline (server will be set by gateway)
      if (this.accessControlService.server) {
        this.accessControlService.publishUserOffline(
          this.accessControlService.server,
          client.userKey,
          client.userName
        );
      }


      this.logger.log(`User ${client.userName} (${client.userKey}) disconnected`);
    }
  }

  // Auto-mark messages as delivered when user connects
  private async markMessagesAsDelivered(userKey: string): Promise<void> {
    try {
      // Find all messages sent to this user that are not yet delivered
      const undeliveredMessages = await this.chatMessageRepository.findAll({
        recipientKey: userKey,
        'messageStatus.userKey': { $ne: userKey }, // Messages where this user hasn't been marked as delivered
        deletedAt: null
      });

      // Mark each message as delivered
      for (const message of undeliveredMessages) {
        await this.chatMessageRepository.updateMessageStatus(
          message._id.toString(),
          userKey,
          MESSAGE_STATUS.DELIVERED
        );

        // Notify sender about delivery (server will be set by gateway)
        if (this.accessControlService.server) {
          this.accessControlService.publishMessageStatusUpdate(
            this.accessControlService.server,
            message._id.toString(),
            userKey,
            MESSAGE_STATUS.DELIVERED,
            message.senderKey
          );
        }
      }

      if (undeliveredMessages.length > 0) {
        this.logger.log(`Marked ${undeliveredMessages.length} messages as delivered for user ${userKey}`);
      }
    } catch (error) {
      this.logger.error(`Error marking messages as delivered for user ${userKey}:`, error);
    }
  }

  // Helper method to get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Helper method to get user's socket ID
  getUserSocketId(userKey: string): string | undefined {
    return this.connectedUsers.get(userKey);
  }
}
