import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketGateway } from '@nestjs/websockets';

export interface AuditLogEntry {
  timestamp: Date;
  userKey: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const wsContext = context.switchToWs();
    
    // Check if this is a WebSocket context
    if (wsContext) {
      return this.handleWebSocketAudit(context, next);
    }
    
    // Handle HTTP requests
    return this.handleHttpAudit(context, next);
  }

  private handleWebSocketAudit(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const data = wsContext.getData();
    const handler = context.getHandler();
    
    const startTime = Date.now();
    
    // Extract user info from socket
    const userKey = client.userKey;
    const userName = client.userName;
    const eventName = this.getEventName(handler);
    
    // Log before execution
    this.logWebSocketAction({
      userKey: userKey || 'unknown',
      userName: userName || 'unknown',
      action: `WS_${eventName}`,
      resource: 'SOCKET_EVENT',
      details: {
        event: eventName,
        data: this.sanitizeData(data),
        socketId: client.id
      }
    });

    return next.handle().pipe(
      tap({
        next: (result) => {
          const duration = Date.now() - startTime;
          this.logWebSocketAction({
            userKey: userKey || 'unknown',
            userName: userName || 'unknown',
            action: `WS_${eventName}_SUCCESS`,
            resource: 'SOCKET_EVENT',
            details: {
              event: eventName,
              duration: `${duration}ms`,
              success: true
            }
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logWebSocketAction({
            userKey: userKey || 'unknown',
            userName: userName || 'unknown',
            action: `WS_${eventName}_ERROR`,
            resource: 'SOCKET_EVENT',
            details: {
              event: eventName,
              duration: `${duration}ms`,
              error: error.message,
              success: false
            }
          });
        }
      })
    );
  }

  private handleHttpAudit(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    const startTime = Date.now();
    const userKey = request.user?.userKey || 'anonymous';
    const userName = request.user?.userName || 'anonymous';
    const method = request.method;
    const endpoint = request.url;
    
    // Log before execution
    this.logHttpAction({
      userKey,
      userName,
      action: `HTTP_${method}`,
      resource: 'HTTP_REQUEST',
      method,
      endpoint,
      details: {
        url: request.url,
        method: request.method,
        body: this.sanitizeData(request.body),
        query: request.query,
        params: request.params
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    return next.handle().pipe(
      tap({
        next: (result) => {
          const duration = Date.now() - startTime;
          this.logHttpAction({
            userKey,
            userName,
            action: `HTTP_${method}_SUCCESS`,
            resource: 'HTTP_REQUEST',
            method,
            endpoint,
            details: {
              duration: `${duration}ms`,
              statusCode: 200,
              success: true
            }
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logHttpAction({
            userKey,
            userName,
            action: `HTTP_${method}_ERROR`,
            resource: 'HTTP_REQUEST',
            method,
            endpoint,
            details: {
              duration: `${duration}ms`,
              statusCode: error.status || 500,
              error: error.message,
              success: false
            }
          });
        }
      })
    );
  }

  private getEventName(handler: Function): string {
    // Extract event name from handler name
    const handlerName = handler.name;
    
    // Map handler names to event names
    const eventMap: Record<string, string> = {
      'handleSendMessage': 'SEND_MESSAGE',
      'handleGetMessageHistory': 'GET_MESSAGE_HISTORY',
      'handleTypingStart': 'TYPING_START',
      'handleTypingStop': 'TYPING_STOP',
      'handleMessageDelivered': 'MESSAGE_DELIVERED',
      'handleMessageRead': 'MESSAGE_READ',
      'handleConnection': 'CONNECTION',
      'handleDisconnect': 'DISCONNECT',
      'handleUploadFileChunk': 'UPLOAD_FILE_CHUNK'
    };
    
    return eventMap[handlerName] || handlerName.toUpperCase();
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information
    const sanitized = { ...data };
    
    // Remove password fields
    if (sanitized.password) {
      sanitized.password = '[REDACTED]';
    }
    
    // Truncate large content
    if (sanitized.content && sanitized.content.length > 100) {
      sanitized.content = sanitized.content.substring(0, 100) + '...';
    }
    
    return sanitized;
  }

  private logWebSocketAction(entry: Partial<AuditLogEntry>): void {
    const logEntry: AuditLogEntry = {
      timestamp: new Date(),
      userKey: entry.userKey || 'unknown',
      userName: entry.userName || 'unknown',
      action: entry.action || 'UNKNOWN',
      resource: entry.resource || 'UNKNOWN',
      resourceId: entry.resourceId,
      details: entry.details,
      method: 'WEBSOCKET',
      endpoint: entry.details?.event as string || 'unknown'
    };

    this.logger.log(`AUDIT: ${JSON.stringify(logEntry)}`);
  }

  private logHttpAction(entry: Partial<AuditLogEntry>): void {
    const logEntry: AuditLogEntry = {
      timestamp: new Date(),
      userKey: entry.userKey || 'unknown',
      userName: entry.userName || 'unknown',
      action: entry.action || 'UNKNOWN',
      resource: entry.resource || 'UNKNOWN',
      resourceId: entry.resourceId,
      details: entry.details,
      method: entry.method || 'UNKNOWN',
      endpoint: entry.endpoint || 'unknown',
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent
    };

    this.logger.log(`AUDIT: ${JSON.stringify(logEntry)}`);
  }
}
