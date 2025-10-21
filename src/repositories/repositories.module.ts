import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from 'src/schemas/user.schema';
import { ChatRoomEntity, ChatRoomSchema } from 'src/schemas/chat-room.schema';
import { ChatMessageEntity, ChatMessageSchema } from 'src/schemas/chat-message.schema';
import { UserRepository } from './user.repository';
import { ChatRoomRepository } from './chat-room.repository';
import { ChatMessageRepository } from './chat-message.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: ChatRoomEntity.name, schema: ChatRoomSchema },
      { name: ChatMessageEntity.name, schema: ChatMessageSchema },
    ]),
  ],
  providers: [
    UserRepository,
    ChatRoomRepository,
    ChatMessageRepository,
  ],
  exports: [
    UserRepository,
    ChatRoomRepository,
    ChatMessageRepository,
  ],
})
export class RepositoriesModule {}
