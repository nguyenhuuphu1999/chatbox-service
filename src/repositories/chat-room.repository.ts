import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongeeseRepository } from "src/base/repository/abstract-repository";
import { ChatRoomDocument, ChatRoomEntity } from "src/schemas/chat-room.schema";

@Injectable()
export class ChatRoomRepository extends BaseMongeeseRepository<ChatRoomDocument> {
    public constructor(
        @InjectModel(ChatRoomEntity.name)
        private readonly chatRoomModel: Model<ChatRoomDocument>
    ) {
        super(chatRoomModel);
    }

    public async findRoomsByUserKey(userKey: string): Promise<ChatRoomDocument[]> {
        return this.findAll({ 
            $or: [
                { user1Key: userKey },
                { user2Key: userKey }
            ]
        });
    }

    public async findPrivateRoomBetweenUsers(user1Key: string, user2Key: string): Promise<ChatRoomDocument | null> {
        return this.findOne({ 
            $or: [
                { user1Key: user1Key, user2Key: user2Key },
                { user1Key: user2Key, user2Key: user1Key }
            ]
        });
    }

    public async updateLastMessage(roomId: string, message: string): Promise<ChatRoomDocument | null> {
        return this.updateById(roomId, { 
            lastMessage: message, 
            lastMessageAt: new Date() 
        });
    }
}
