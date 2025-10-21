import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { CreateUserService, CreateUserRequest } from './services/create-user.service';
import { GetUserService } from './services/get-user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly getUserService: GetUserService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserRequest: CreateUserRequest) {
    try {
      const result = await this.createUserService.createUser(createUserRequest);
      return {
        success: true,
        data: result,
        message: 'User created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create user',
      };
    }
  }

  @Get(':userKey')
  async getUser(@Param('userKey') userKey: string) {
    try {
      const result = await this.getUserService.getUser({ id: userKey });
      return {
        success: true,
        data: result,
        message: 'User retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get user',
      };
    }
  }
}
