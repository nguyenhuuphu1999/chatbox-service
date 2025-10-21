import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { MESSAGE_CONSTANTS, MessageType } from 'src/shared/constants/message.constants';

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  public url: string;

  @IsString()
  @IsNotEmpty()
  public type: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsNotEmpty()
  public size: number;

  @IsOptional()
  public duration?: number;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  public recipientKey: string;

  @IsString()
  @IsNotEmpty()
  public content: string;

  @IsEnum(Object.values(MESSAGE_CONSTANTS.TYPES))
  public messageType: MessageType;

  @IsOptional()
  @IsString()
  public replyTo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  public attachments?: AttachmentDto[];
}
