import { Catch, ArgumentsHost, BadRequestException, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AccessControlService } from '../services/access-control.service';
import { AuthenticatedSocket } from '../interfaces/socket.interface';
import { SOCKET_EVENTS } from 'src/shared/constants';

@Injectable()
@Catch(BadRequestException)
export class WsValidationExceptionFilter {
  constructor(private readonly accessControlService: AccessControlService) {}

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const client: AuthenticatedSocket = host.switchToWs().getClient();
    const event = host.switchToWs().getPattern();
    
    const response = exception.getResponse() as any;
    const validationErrors = response?.message || ['Validation failed'];
    
    // Create error response
    const errorResponse = {
      code: 'VALIDATION_ERROR',
      message: Array.isArray(validationErrors) ? validationErrors.join(', ') : validationErrors,
      details: {
        event,
        validationErrors: Array.isArray(validationErrors) ? validationErrors : [validationErrors]
      },
      timestamp: new Date()
    };

    console.log('🚨 Validation error caught:', JSON.stringify(errorResponse, null, 2));

    // Always emit directly to client first (most reliable)
    client.emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ERROR, errorResponse);

    // Also try to publish through AccessControlService if available
    if (this.accessControlService.server && client.userKey) {
      this.accessControlService.publishError(
        this.accessControlService.server,
        client.userKey,
        errorResponse
      );
    }

    // Don't throw WsException to avoid double error handling
    return;
  }
}
