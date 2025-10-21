import { IsNotEmpty, IsString } from "class-validator";

export class TypingDto {
  @IsNotEmpty()
  @IsString()
  public recipientKey: string;
}