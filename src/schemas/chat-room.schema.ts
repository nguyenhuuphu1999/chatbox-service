import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseEntity } from "src/base/entities/base.entity";
import { IChatRoom } from "src/modules/chat/interfaces/chat.interface";

export const COLLECTION_CHAT_ROOM_NAME = "chatRooms";

@Schema({ timestamps: true, collection: COLLECTION_CHAT_ROOM_NAME })
export class ChatRoomEntity extends BaseEntity implements IChatRoom {
    @Prop({ required: true })
    public name: string;

    @Prop({ required: false })
    public description?: string;

    @Prop({ required: true })
    public user1Key: string; // User 1

    @Prop({ required: true })
    public user2Key: string; // User 2

    @Prop({ required: true })
    public createdBy: string; // User Key

    @Prop({ required: false })
    public lastMessage?: string;

    @Prop({ required: false })
    public lastMessageAt?: Date;
}

export type ChatRoomDocument = HydratedDocument<ChatRoomEntity>;
export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoomEntity);
