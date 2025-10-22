import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadService } from '../services/file-upload.service';

export interface UploadImageResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

@Controller('upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No image file provided');
      }

      const fileUrl = `/uploads/images/${file.filename}`;

      return {
        success: true,
        data: {
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }
  }

  @Post('file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/files',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Allow images and documents (excluding videos)
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('File type not allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const fileUrl = `/uploads/files/${file.filename}`;

      return {
        success: true,
        data: {
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  @Post('video')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Allow only video files
        const allowedMimes = [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/avi',
          'video/mov',
          'video/wmv',
          'video/flv',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only video files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for videos
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No video file provided');
      }

      const fileUrl = `/uploads/videos/${file.filename}`;

      return {
        success: true,
        data: {
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to upload video',
      };
    }
  }
}
