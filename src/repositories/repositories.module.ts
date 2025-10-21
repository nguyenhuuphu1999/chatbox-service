import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from 'src/schemas/user.schema';
import { ChatMessageEntity, ChatMessageSchema } from 'src/schemas/chat-message.schema';
import { UserRepository } from './user.repository';
import { ChatMessageRepository } from './chat-message.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: ChatMessageEntity.name, schema: ChatMessageSchema },
    ]),
  ],
  providers: [
    UserRepository,
    ChatMessageRepository,
  ],
  exports: [
    UserRepository,
    ChatMessageRepository,
  ],
})
export class RepositoriesModule {}
