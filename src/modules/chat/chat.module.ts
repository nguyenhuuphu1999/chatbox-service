import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
// Removed FileUploadGateway - merged into ChatGateway
import { ConnectionService } from './services/connection.service';
import { MessageHandlerService } from './services/message-handler.service';
import { TypingService } from './services/typing.service';
import { MessageStatusService } from './services/message-status.service';
import { AuditLogService } from './services/audit-log.service';
import { SendMessageService } from './services/send-message.service';
import { FileUploadService } from './services/file-upload.service';
import { RepositoriesModule } from 'src/repositories/repositories.module';
import { AccessControlService } from './services/access-control.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UploadHandlerService } from './services/upload-handler.service';
import { WsValidationExceptionFilter } from './filters/ws-validation-exception.filter';

@Module({
  imports: [RepositoriesModule],
  providers: [
    ChatGateway,
    ConnectionService,
    MessageHandlerService,
    TypingService,
    MessageStatusService,
    AuditLogService,
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
    TypingService,
    MessageStatusService,
    AuditLogService,
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
