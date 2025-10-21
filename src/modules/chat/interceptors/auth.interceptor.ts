import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WebSocketGateway } from '@nestjs/websockets';
import { SOCKET_EVENTS } from 'src/shared/constants';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsContext = context.switchToWs();
    
    // Check if this is a WebSocket context
    if (wsContext) {
      return this.handleWebSocketAuth(context, next);
    }
    
    // For HTTP requests, continue without auth check (handled by other guards)
    return next.handle();
  }

  private handleWebSocketAuth(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const handler = context.getHandler();
    
    // Skip auth check for connection/disconnection handlers
    const handlerName = handler.name;
    if (handlerName === 'handleConnection' || handlerName === 'handleDisconnect') {
      return next.handle();
    }
    
    // Check if user is authenticated
    if (!client.userKey) {
      this.logger.warn(`Unauthorized access attempt from socket ${client.id}`);
      
      // Emit error to client
      client.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date(),
      });
      
      // Disconnect unauthorized client
      client.disconnect();
      
      // Return error response
      return throwError(() => ({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      }));
    }
    
    // User is authenticated, continue with request
    return next.handle().pipe(
      catchError((error) => {
        this.logger.error(`Error in authenticated request from ${client.userKey}:`, error);
        return throwError(() => error);
      })
    );
  }
}
