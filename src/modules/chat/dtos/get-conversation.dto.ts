import { IsString, IsNotEmpty } from 'class-validator';
import { PagingRequestDto } from './paging.dto';

export class GetConversationDto extends PagingRequestDto {
  @IsString()
  @IsNotEmpty()
  partnerKey: string;
}
