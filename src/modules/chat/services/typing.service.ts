import { Injectable, Logger } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AuthenticatedSocket, ServiceResponse } from '../interfaces/socket.interface';
import { TypingDto } from '../dtos/typing.dto';

@Injectable()
export class TypingService {
  private readonly logger = new Logger(TypingService.name);

  constructor(
    private readonly accessControlService: AccessControlService,
  ) {}

  public async handleTypingStart(
    data: TypingDto,
    client: AuthenticatedSocket,
  ): Promise<ServiceResponse> {
    try {
      // Publish typing start event to recipient only
      this.accessControlService.publishTypingStart(
        this.accessControlService.server!,
        client.userKey,
        client.userName || '',
        data.recipientKey
      );

      this.logger.log(`Typing start: ${client.userName} to ${data.recipientKey}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Typing start error:', error);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async handleTypingStop(
    data: TypingDto,
    client: AuthenticatedSocket,
  ): Promise<ServiceResponse> {
    try {
      // Publish typing stop event to recipient only
      this.accessControlService.publishTypingStop(
        this.accessControlService.server!,
        client.userKey,
        client.userName || '',
        data.recipientKey
      );

      this.logger.log(`Typing stop: ${client.userName} to ${data.recipientKey}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Typing stop error:', error);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
