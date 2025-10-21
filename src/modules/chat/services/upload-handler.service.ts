import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { UploadFileChunkDto } from '../dtos/file-upload.dto';
import { AuthenticatedSocket, ServiceResponse, FileUploadCompleteInfo } from '../interfaces/socket.interface';
import { UploadChunkRequest, UploadChunkResponse } from '../interfaces/file-upload.interface';
import { UserRepository } from 'src/repositories/user.repository';
import { FileUploadService } from './file-upload.service';
import { AccessControlService } from './access-control.service';

@Injectable()
export class UploadHandlerService {
  private readonly logger = new Logger(UploadHandlerService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileUploadService: FileUploadService,
    private readonly accessControlService: AccessControlService,
  ) {}

  public async handleUploadFileChunk(
    data: UploadFileChunkDto,
    client: AuthenticatedSocket,
  ): Promise<ServiceResponse<UploadChunkResponse>> {
    try {
      const recipient = await this.userRepository.findByUserKey(data.recipientKey);
      if (!recipient) {
        this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', {
          code: 'RECIPIENT_NOT_FOUND',
          message: 'Recipient not found'
        });
        return { error: 'Recipient not found' };
      }

      const chunkBuffer = Buffer.from(data.chunkData, 'base64');

      const uploadRequest: UploadChunkRequest = {
        fileId: data.fileId,
        chunkIndex: data.chunkIndex,
        totalChunks: data.totalChunks,
        chunkData: chunkBuffer,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
      };

      const result = await this.fileUploadService.uploadChunk(uploadRequest);

      this.accessControlService.publishUploadProgress(
        this.accessControlService.server!,
        client.userKey || '',
        data.fileId,
        result.progress,
        data.recipientKey
      );

      if (result.success && result.url) {
        const fileInfo: FileUploadCompleteInfo = {
          fileId: data.fileId,
          url: result.url,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        };
        this.accessControlService.publishUploadComplete(
          this.accessControlService.server!,
          client.userKey || '',
          fileInfo,
          data.recipientKey
        );
      }

      this.logger.log(`File chunk ${data.chunkIndex}/${data.totalChunks} uploaded by ${client.userName} for ${data.recipientKey}`);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('File upload error:', error);
      this.accessControlService.publishError(this.accessControlService.server!, client.userKey || '', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}


