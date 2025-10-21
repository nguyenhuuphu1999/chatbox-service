import { IsString, IsNotEmpty, IsEnum, IsArray, MaxLength, ValidateNested, IsOptional } from 'class-validator';
import { MESSAGE_CONSTANTS } from '../constants/message.constants';

export class AttachmentValidation {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  size: number;

  @IsOptional()
  duration?: number;
}

export class MessageValidation {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  senderKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_CONSTANTS.VALIDATION.CONTENT_MAX_LENGTH)
  content: string;

  @IsEnum(Object.values(MESSAGE_CONSTANTS.TYPES))
  messageType: keyof typeof MESSAGE_CONSTANTS.TYPES;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  attachments?: AttachmentValidation[];
}

