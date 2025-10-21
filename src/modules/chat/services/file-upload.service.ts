import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MESSAGE_CONSTANTS } from 'src/shared/constants';

export interface ChunkUploadRequest {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: Buffer;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface ChunkUploadResponse {
  success: boolean;
  chunkIndex: number;
  totalChunks: number;
  progress: number;
  fileId?: string;
  url?: string;
  error?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly supportedTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.maxFileSize = MESSAGE_CONSTANTS.VALIDATION.MAX_FILE_SIZE;
    this.supportedTypes = [
      ...MESSAGE_CONSTANTS.SUPPORTED_IMAGE_TYPES,
      ...MESSAGE_CONSTANTS.SUPPORTED_VIDEO_TYPES,
      ...MESSAGE_CONSTANTS.SUPPORTED_FILE_TYPES,
    ];
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadChunk(request: ChunkUploadRequest): Promise<ChunkUploadResponse> {
    try {
      // Validate file type
      if (!this.isValidFileType(request.fileType)) {
        return {
          success: false,
          chunkIndex: request.chunkIndex,
          totalChunks: request.totalChunks,
          progress: 0,
          error: 'Unsupported file type',
        };
      }

      // Validate file size
      if (request.fileSize > this.maxFileSize) {
        return {
          success: false,
          chunkIndex: request.chunkIndex,
          totalChunks: request.totalChunks,
          progress: 0,
          error: 'File too large',
        };
      }

      const chunkDir = path.join(this.uploadPath, 'chunks', request.fileId);
      
      // Create chunk directory if not exists
      if (!fs.existsSync(chunkDir)) {
        fs.mkdirSync(chunkDir, { recursive: true });
      }

      // Save chunk
      const chunkPath = path.join(chunkDir, `chunk_${request.chunkIndex}`);
      fs.writeFileSync(chunkPath, request.chunkData);

      const progress = ((request.chunkIndex + 1) / request.totalChunks) * 100;

      // If this is the last chunk, merge all chunks
      if (request.chunkIndex === request.totalChunks - 1) {
        const finalFile = await this.mergeChunks(request.fileId, request.fileName, request.fileType);
        
        // Clean up chunks
        this.cleanupChunks(request.fileId);

        return {
          success: true,
          chunkIndex: request.chunkIndex,
          totalChunks: request.totalChunks,
          progress: 100,
          fileId: request.fileId,
          url: finalFile.url,
        };
      }

      return {
        success: true,
        chunkIndex: request.chunkIndex,
        totalChunks: request.totalChunks,
        progress: progress,
        fileId: request.fileId,
      };
    } catch (error) {
      this.logger.error(`Error uploading chunk: ${error.message}`);
      return {
        success: false,
        chunkIndex: request.chunkIndex,
        totalChunks: request.totalChunks,
        progress: 0,
        error: error.message,
      };
    }
  }

  private async mergeChunks(fileId: string, fileName: string, fileType: string): Promise<{ url: string }> {
    const chunkDir = path.join(this.uploadPath, 'chunks', fileId);
    const chunks = fs.readdirSync(chunkDir).sort((a, b) => {
      const aIndex = parseInt(a.split('_')[1]);
      const bIndex = parseInt(b.split('_')[1]);
      return aIndex - bIndex;
    });

    // Generate final file name
    const fileExtension = path.extname(fileName);
    const finalFileName = `${fileId}${fileExtension}`;
    const finalFilePath = path.join(this.uploadPath, finalFileName);

    // Merge chunks
    const writeStream = fs.createWriteStream(finalFilePath);
    
    for (const chunk of chunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    // Generate URL
    const url = `/uploads/${finalFileName}`;

    return { url };
  }

  private cleanupChunks(fileId: string): void {
    const chunkDir = path.join(this.uploadPath, 'chunks', fileId);
    if (fs.existsSync(chunkDir)) {
      fs.rmSync(chunkDir, { recursive: true, force: true });
    }
  }

  private isValidFileType(fileType: string): boolean {
    return this.supportedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });
  }

  generateFileId(): string {
    return uuidv4();
  }
}

