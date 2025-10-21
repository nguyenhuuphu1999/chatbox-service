import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
// Removed FileUploadGateway - merged into ChatGateway
import { ConnectionService } from './services/connection.service';
import { MessageHandlerService } from './services/message-handler.service';
import { TypingService } from './services/typing.service';
import { MessageStatusService } from './services/message-status.service';
import { SendMessageService } from './services/send-message.service';
import { FileUploadService } from './services/file-upload.service';
import { RepositoriesModule } from 'src/repositories/repositories.module';
import { AccessControlService } from './services/access-control.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UploadHandlerService } from './services/upload-handler.service';
import { WsValidationExceptionFilter } from './filters/ws-validation-exception.filter';
import { ConversationListService } from './services/conversation-list.service';
import { GetConversationService } from './services/get-conversation.service';
import { FileUploadController } from './controllers/file-upload.controller';

@Module({
  imports: [RepositoriesModule],
  controllers: [FileUploadController],
  providers: [
    ChatGateway,
    ConnectionService,
    MessageHandlerService,
    ConversationListService,
    GetConversationService,
    TypingService,
    MessageStatusService,
    AuditLogInterceptor,
    AuthInterceptor,
    WsValidationExceptionFilter,
    SendMessageService,
    FileUploadService,
    AccessControlService,
    UploadHandlerService,
  ],
  exports: [
    ChatGateway,
    ConnectionService,
    MessageHandlerService,
    ConversationListService,
    GetConversationService,
    TypingService,
    MessageStatusService,
    AuditLogInterceptor,
    AuthInterceptor,
    WsValidationExceptionFilter,
    SendMessageService,
    FileUploadService,
    AccessControlService,
    UploadHandlerService,
  ],
})
export class ChatModule {}
