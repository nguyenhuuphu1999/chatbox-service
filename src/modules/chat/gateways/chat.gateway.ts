import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UsePipes, ValidationPipe, UseInterceptors, UseFilters } from '@nestjs/common';
import { ConnectionService } from '../services/connection.service';
import { MessageHandlerService } from '../services/message-handler.service';
import { TypingService } from '../services/typing.service';
import { MessageStatusService } from '../services/message-status.service';
import { AccessControlService } from '../services/access-control.service';
import { AuditLogInterceptor } from '../interceptors/audit-log.interceptor';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { WsValidationExceptionFilter } from '../filters/ws-validation-exception.filter';
import { SOCKET_EVENTS } from 'src/shared/constants';
import { AuthenticatedSocket } from '../interfaces/socket.interface';
import { SendMessageDto } from '../dtos/send-message.dto';
import { GetMessageHistoryDto } from '../dtos/message-history.dto';
import { GetConversationDto } from '../dtos/get-conversation.dto';
import { TypingDto } from '../dtos/typing.dto';
import { MessageStatusDto } from '../dtos/message-status.dto';
import { UploadFileChunkDto } from '../dtos/file-upload.dto';
import { UploadHandlerService } from '../services/upload-handler.service';
import { ConversationListService } from '../services/conversation-list.service';
import { GetConversationService } from '../services/get-conversation.service';

/**
 * ChatGateway - Main WebSocket Gateway for Chat Application
  *
  * Main functions:
  * - Handles Socket.IO connection/disconnection
  * - Route event messages to corresponding services
  * - Validation DTOs for all incoming data
  * - Manage authentication and authorization
  * - Publish events via AccessControlService
 */
@Injectable()
@UseInterceptors(AuthInterceptor, AuditLogInterceptor)
@UseFilters(WsValidationExceptionFilter)
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionService: ConnectionService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly typingService: TypingService,
    private readonly messageStatusService: MessageStatusService,
    private readonly uploadHandlerService: UploadHandlerService,
    private readonly accessControlService: AccessControlService,
    private readonly conversationListService: ConversationListService,
    private readonly getConversationService: GetConversationService,
  ) { }

  public async handleConnection(client: AuthenticatedSocket) {
    // Set server reference in access control service
    this.accessControlService.server = this.server;
    await this.connectionService.handleConnection(client);
  }

  public async handleDisconnect(client: AuthenticatedSocket) {
    await this.connectionService.handleDisconnection(client);
  }

  // ==================== MESSAGE EVENTS ====================

  /**
   * Handle send message event
   * - Validates message data using SendMessageDto
   * - Delegates to MessageHandlerService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.SEND_MESSAGE)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.messageHandlerService.handleSendMessage(data, client);
  }

  // ==================== GET LIST CONVERSATION EVENTS ====================
  /**
   * Handle get message history event
   * - Validates pagination data using GetMessageHistoryDto
   * - Returns conversation list for authenticated user
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.CONVERSATION_LIST)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleGetMessageHistory(
    @MessageBody() data: GetMessageHistoryDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.conversationListService.handleConversationList(data, client);
  }

  // ==================== GET CONVERSATION EVENTS ====================
  /**
   * Handle get conversation event
   * - Validates partner key and pagination data using GetConversationDto
   * - Returns detailed messages between current user and specified partner
   * - Response format same as send message
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.GET_CONVERSATION)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleGetConversation(
    @MessageBody() data: GetConversationDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.getConversationService.handleGetConversation(data, client);
  }

  // ==================== TYPING EVENTS ====================

  /**
   * Handle typing start event
   * - Validates recipient data using TypingDto
   * - Delegates to TypingService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.TYPING_START)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleTypingStart(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.typingService.handleTypingStart(data, client);
  }

  /**
   * Handle typing stop event
   * - Validates recipient data using TypingDto
   * - Delegates to TypingService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.TYPING_STOP)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleTypingStop(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.typingService.handleTypingStop(data, client);
  }

  // ==================== MESSAGE STATUS EVENTS ====================

  /**
   * Handle message delivered event
   * - Validates message status data using MessageStatusDto
   * - Delegates to MessageStatusService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.MESSAGE_DELIVERED)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleMessageDelivered(
    @MessageBody() data: MessageStatusDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    return await this.messageStatusService.handleMessageDelivered(data, client);
  }

  /**
   * Handle message read event
   * - Validates message status data using MessageStatusDto
   * - Delegates to MessageStatusService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.MESSAGE_READ)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleMessageRead(
    @MessageBody() data: MessageStatusDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await this.messageStatusService.handleMessageRead(data, client);
  }

  // ==================== FILE UPLOAD EVENTS ====================

  /**
   * Handle file chunk upload event
   * - Validates upload data using UploadFileChunkDto
   * - Delegates to UploadHandlerService
   */
  @SubscribeMessage(SOCKET_EVENTS.CLIENT_TO_SERVER.UPLOAD_FILE_CHUNK)
  @UsePipes(new ValidationPipe({ transform: true }))
  public async handleUploadFileChunk(
    @MessageBody() data: UploadFileChunkDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.uploadHandlerService.handleUploadFileChunk(data, client);
  }

  // Helper methods
  getConnectedUsers(): string[] {
    return this.connectionService.getConnectedUsers();
  }

  getUserSocketId(userKey: string): string | undefined {
    return this.connectionService.getUserSocketId(userKey);
  }
}
