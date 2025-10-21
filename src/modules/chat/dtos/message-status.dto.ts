import { IsString, IsNotEmpty } from 'class-validator';

export class MessageStatusDto {
  @IsString()
  @IsNotEmpty()
  public messageId: string;

  @IsString()
  @IsNotEmpty()
  public recipientKey: string;
}
