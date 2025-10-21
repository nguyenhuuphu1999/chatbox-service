import { Module } from '@nestjs/common';
import { CreateUserService } from './services/create-user.service';
import { GetUserService } from './services/get-user.service';
import { UserController } from './user.controller';
import { RepositoriesModule } from 'src/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [UserController],
  providers: [CreateUserService, GetUserService],
  exports: [CreateUserService, GetUserService],
})
export class UserModule {}
