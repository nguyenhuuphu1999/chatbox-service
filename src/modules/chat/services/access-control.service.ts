import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from 'src/shared/constants';
import { MessageStatus } from 'src/shared/constants/message-status.constants';
import { MessageWithSender, MessageHistoryResponse, ErrorResponse, FileUploadCompleteInfo, NewMessageEvent } from '../interfaces/socket.interface';

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);
  public server: Server | null = null; // Will be set by gateway

  publishNewMessage(server: Server, message: MessageWithSender, targetUserKey: string): void {
    const newMessageEvent: NewMessageEvent = {
      message,
      timestamp: new Date(),
    };
    
    server.to(`user_${targetUserKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.NEW_MESSAGE, newMessageEvent);
    this.logger.log(`Published new message to user ${targetUserKey}: ${message?.id ?? 'unknown'}`);
  }

  publishMessageHistory(server: Server, userKey: string, data: MessageHistoryResponse): void {
    server.to(`user_${userKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.MESSAGE_HISTORY, {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Published message history to user ${userKey}`);
  }


  publishTypingStart(server: Server, userKey: string, userName: string, recipientKey: string): void {
    server.to(`user_${recipientKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.USER_TYPING, {
      userKey,
      userName,
      recipientKey,
      isTyping: true,
      timestamp: new Date(),
    });
    this.logger.log(`Published typing start: ${userKey} to ${recipientKey}`);
  }

  publishTypingStop(server: Server, userKey: string, userName: string, recipientKey: string): void {
    server.to(`user_${recipientKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.USER_TYPING, {
      userKey,
      userName,
      recipientKey,
      isTyping: false,
      timestamp: new Date(),
    });
    this.logger.log(`Published typing stop: ${userKey} to ${recipientKey}`);
  }

  publishUserOnline(server: Server, userKey: string, userName: string): void {
    server.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.USER_ONLINE, {
      userKey,
      userName,
      isOnline: true,
      timestamp: new Date(),
    });
    this.logger.log(`Published user online: ${userKey}`);
  }

  publishUserOffline(server: Server, userKey: string, userName: string): void {
    server.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.USER_OFFLINE, {
      userKey,
      userName,
      isOnline: false,
      timestamp: new Date(),
    });
    this.logger.log(`Published user offline: ${userKey}`);
  }

  publishUploadProgress(server: Server, userKey: string, fileId: string, progress: number, recipientKey: string): void {
    server.to(`user_${userKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.UPLOAD_PROGRESS, {
      fileId,
      progress,
      recipientKey,
      timestamp: new Date(),
    });
    this.logger.log(`Published upload progress: ${fileId} ${progress}% for user ${userKey}`);
  }

  publishUploadComplete(server: Server, userKey: string, fileInfo: FileUploadCompleteInfo, recipientKey: string): void {
    server.to(`user_${userKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.UPLOAD_COMPLETE, {
      ...fileInfo,
      recipientKey,
      timestamp: new Date(),
    });
    this.logger.log(`Published upload complete: ${fileInfo?.fileId ?? 'unknown'} for user ${userKey}`);
  }

  publishError(server: Server, userKey: string, error: ErrorResponse | Error): void {
    const errorResponse: ErrorResponse = {
      code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
      message: error?.message ?? 'An unknown error occurred',
      details: 'details' in error ? error.details : undefined,
    };
    
    server.to(`user_${userKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, {
      ...errorResponse,
      timestamp: new Date(),
    });
    this.logger.error(`Published error to user ${userKey}: ${error?.message ?? 'unknown'}`);
  }

  publishSuccess(server: Server, userKey: string, data: unknown): void {
    server.to(`user_${userKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.SUCCESS, {
      success: true,
      data,
      timestamp: new Date(),
    });
    this.logger.log(`Published success to user ${userKey}`);
  }

  publishMessageStatusUpdate(
    server: Server, 
    messageId: string, 
    userKey: string, 
    status: MessageStatus,
    recipientKey: string
  ): void {
    server.to(`user_${recipientKey}`).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.MESSAGE_STATUS_UPDATE, {
      messageId,
      userKey,
      status,
      timestamp: new Date(),
    });
    this.logger.log(`Published message status update: ${messageId} - ${userKey} ${status}`);
  }
}


