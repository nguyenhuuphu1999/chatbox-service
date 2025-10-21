import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseEntity } from "src/base/entities/base.entity";
import { IChatMessage } from "src/modules/chat/interfaces/chat.interface";
import { MESSAGE_CONSTANTS, MessageType } from "src/shared/constants/message.constants";
import { MessageStatus, IMessageStatusEntry } from "src/shared/constants/message-status.constants";

export const COLLECTION_CHAT_MESSAGE_NAME = "chatMessages";

@Schema({ timestamps: true, collection: COLLECTION_CHAT_MESSAGE_NAME })
export class ChatMessageEntity extends BaseEntity implements IChatMessage {
    @Prop({ required: false })
    public recipientKey?: string; // User Key của người nhận (optional)

    @Prop({ required: true })
    public senderKey: string; // User Key của người gửi

    @Prop({ required: true })
    public content: string;

    @Prop({ 
        required: true, 
        enum: Object.values(MESSAGE_CONSTANTS.TYPES), 
        default: MESSAGE_CONSTANTS.TYPES.TEXT 
    })
    public messageType: MessageType;

    @Prop({ required: false })
    public replyTo?: string; // Message ID being replied to

    @Prop({ default: false })
    public isEdited?: boolean;

    @Prop({ default: null })
    public editedAt?: Date;

    @Prop({
        type: [{
            url: String,
            type: String,
            name: String,
            size: Number,
            duration: Number
        }],
        required: false
    })
    public attachments?: {
        url: string;
        type: string;
        name: string;
        size: number;
        duration?: number;
    }[];

    // Message status tracking
    @Prop({
        type: [{
            userKey: String,
            status: String, // 'sent', 'delivered', 'read'
            timestamp: Date
        }],
        required: false,
        default: []
    })
    public messageStatus?: IMessageStatusEntry[];
}

export type ChatMessageDocument = HydratedDocument<ChatMessageEntity>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessageEntity);
