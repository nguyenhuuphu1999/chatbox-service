import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileChunkDto {
  @IsString()
  @IsNotEmpty()
  public fileId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  public chunkIndex: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  public totalChunks: number;

  @IsString()
  @IsNotEmpty()
  public chunkData: string; // Base64 encoded

  @IsString()
  @IsNotEmpty()
  public fileName: string;

  @IsString()
  @IsNotEmpty()
  public fileType: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public fileSize: number;

  @IsString()
  @IsNotEmpty()
  public recipientKey: string; // Changed from roomId to recipientKey for direct messaging
}
