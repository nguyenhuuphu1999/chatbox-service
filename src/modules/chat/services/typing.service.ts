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
  ): Promise<void> {
    try {
      this.logger.log(`Handle typing start: ${JSON.stringify(data)}`);
      this.accessControlService.publishTypingStart(
        this.accessControlService.server!,
        client.userKey,
        client.userName || '',
        data.recipientKey
      );

      this.logger.log(`Typing start: ${client.userName} to ${data.recipientKey}`);
    } catch (error) {
      this.logger.error(`Typing start error: ${JSON.stringify(error)}`);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
    }
  }

  public async handleTypingStop(
    data: TypingDto,
    client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      this.logger.log(`Handle typing stop: ${JSON.stringify(data)}`);
      this.accessControlService.publishTypingStop(
        this.accessControlService.server!,
        client.userKey,
        client.userName || '',
        data.recipientKey
      );

      this.logger.log(`Typing stop: ${client.userName} to ${data.recipientKey}`);
    } catch (error) {
      this.logger.error(`Typing stop error: ${JSON.stringify(error)}`);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
    }
  }
}
