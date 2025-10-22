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
  recipientKey?: string;
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
  private readonly maxVideoSize: number;
  private readonly chunkSize: number;
  private readonly supportedTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.maxFileSize = MESSAGE_CONSTANTS.VALIDATION.MAX_FILE_SIZE;
    this.maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    this.chunkSize = 1024 * 1024; // 1MB chunks for streaming
    this.supportedTypes = [
      ...MESSAGE_CONSTANTS.SUPPORTED_IMAGE_TYPES,
      ...MESSAGE_CONSTANTS.SUPPORTED_VIDEO_TYPES,
      ...MESSAGE_CONSTANTS.SUPPORTED_FILE_TYPES,
    ];
    
    // Ensure upload directories exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'images'),
      path.join(this.uploadPath, 'videos'),
      path.join(this.uploadPath, 'files'),
      path.join(this.uploadPath, 'chunks'),
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
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

      // Validate file size based on file type
      const maxSize = this.isVideoFile(request.fileType) ? this.maxVideoSize : this.maxFileSize;
      if (request.fileSize > maxSize) {
        return {
          success: false,
          chunkIndex: request.chunkIndex,
          totalChunks: request.totalChunks,
          progress: 0,
          error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB`,
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

    // Generate final file name and determine destination directory
    const fileExtension = path.extname(fileName);
    const finalFileName = `${fileId}${fileExtension}`;
    
    // Determine destination directory based on file type
    const destinationDir = this.isVideoFile(fileType) 
      ? path.join(this.uploadPath, 'videos')
      : this.isImageFile(fileType)
      ? path.join(this.uploadPath, 'images')
      : path.join(this.uploadPath, 'files');
    
    const finalFilePath = path.join(destinationDir, finalFileName);

    // Merge chunks using streaming for better performance
    const writeStream = fs.createWriteStream(finalFilePath);
    
    for (const chunk of chunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    // Generate URL based on file type
    const urlPath = this.isVideoFile(fileType) 
      ? `/uploads/videos/${finalFileName}`
      : this.isImageFile(fileType)
      ? `/uploads/images/${finalFileName}`
      : `/uploads/files/${finalFileName}`;

    return { url: urlPath };
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

  private isVideoFile(fileType: string): boolean {
    return fileType.startsWith('video/');
  }

  private isImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  generateFileId(): string {
    return uuidv4();
  }

  getChunkSize(): number {
    return this.chunkSize;
  }

  getMaxVideoSize(): number {
    return this.maxVideoSize;
  }
}

