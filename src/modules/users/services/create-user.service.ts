import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UserRepository } from 'src/repositories/user.repository';
import { Types } from 'mongoose';

export interface CreateUserRequest {
    userKey: string;
    userName: string;
    phoneNumber: string;
    fullName: string;
    avatar?: string;
}

export interface CreateUserResponse {
    id: string;
    userKey: string;
    userName: string;
    phoneNumber: string;
    fullName: string;
    avatar?: string;
    isOnline: boolean;
    createdAt: Date;
}

@Injectable()
export class CreateUserService {
  public logger = new Logger(CreateUserService.name)
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  public async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // Check if user already exists
      const existingUserByUserKey = await this.userRepository.findByUserKey(request.userKey);
      if (existingUserByUserKey) {
        const errorMessage = 'User with this user key already exists'
        this.logger.error(errorMessage)
        throw new BadRequestException(errorMessage);
      }

      const existingUserByPhoneNumber = await this.userRepository.findByPhoneNumber(request.phoneNumber);
      if (existingUserByPhoneNumber) {
        const errorMessage = "User with this phone number already exists";
        this.logger.error(errorMessage)
        throw new BadRequestException(errorMessage);
      }

      // Create user
      const user = await this.userRepository.create({
        userKey: request.userKey,
        userName: request.userName,
        phoneNumber: request.phoneNumber,
        fullName: request.fullName,
        avatar: request.avatar,
        isOnline: false,
        lastSeen: new Date(),
      });

      return {
        id: user._id.toString(),
        userKey: user.userKey,
        userName: user.userName,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        avatar: user.avatar,
        isOnline: user.isOnline,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Something went wrong while creating user: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException('Something went wrong while creating user');
    }
  }
}
