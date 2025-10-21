import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { USER_CONSTANTS } from '../constants/user.constants';

export class UserConnectionValidation {
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.VALIDATION.USER_KEY_MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.VALIDATION.USER_KEY_MAX_LENGTH)
  userKey: string;
}

