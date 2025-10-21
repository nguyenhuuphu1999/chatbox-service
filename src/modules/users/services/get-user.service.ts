import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from 'src/repositories/user.repository';
import { Types } from 'mongoose';

export interface GetUserParams {
    id: string;
}

export interface GetUserResponse {
    id: string;
    userKey: string;
    userName: string;
    phoneNumber: string;
    fullName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class GetUserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  public async getUser(param: GetUserParams): Promise<GetUserResponse> {
    try {
      const user = await this.userRepository.findById(param.id);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return {
        id: user._id.toString(),
        userKey: user.userKey,
        userName: user.userName,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong while getting user');
    }
  }
}
