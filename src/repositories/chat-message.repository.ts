import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongeeseRepository } from "src/base/repository/abstract-repository";
import { ChatMessageDocument, ChatMessageEntity } from "src/schemas/chat-message.schema";
import { MessageStatus } from "src/shared/constants/message-status.constants";

@Injectable()
export class ChatMessageRepository extends BaseMongeeseRepository<ChatMessageDocument> {
    public constructor(
        @InjectModel(ChatMessageEntity.name)
        private readonly chatMessageModel: Model<ChatMessageDocument>
    ) {
        super(chatMessageModel);
        console.log('🔧 ChatMessageRepository initialized with model:', this.chatMessageModel.modelName);
    }

    public async findMessagesBetweenUsers(
        user1Key: string,
        user2Key: string, 
        page: number = 1, 
        limit: number = 50
    ): Promise<ChatMessageDocument[]> {
        const skip = (page - 1) * limit;
        return this.chatMessageModel
            .find({ 
                $or: [
                    { senderKey: user1Key, recipientKey: user2Key },
                    { senderKey: user2Key, recipientKey: user1Key }
                ],
                deletedAt: null 
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('senderKey', 'userName avatar')
            .exec();
    }

    public async findMessageById(messageId: string): Promise<ChatMessageDocument | null> {
        return this.findById(messageId);
    }

    public async markAsEdited(messageId: string): Promise<ChatMessageDocument | null> {
        return this.updateById(messageId, { 
            isEdited: true, 
            editedAt: new Date() 
        });
    }

    public async findRepliesToMessage(messageId: string): Promise<ChatMessageDocument[]> {
        return this.findAll({ replyTo: messageId });
    }

    public async getMessageCountBetweenUsers(user1Key: string, user2Key: string): Promise<number> {
        return this.count({ 
            $or: [
                { senderKey: user1Key, recipientKey: user2Key },
                { senderKey: user2Key, recipientKey: user1Key }
            ]
        });
    }

    public async getConversationsByUserPaginated(
        userKey: string,
        page: number,
        limit: number
    ): Promise<{ items: Array<{ partnerKey: string; lastMessage: any; messageCount: number; unreadCount: number }>; total: number; }> {
        const skip = (page - 1) * limit;

        const pipeline: any[] = [
            { $match: { $or: [{ senderKey: userKey }, { recipientKey: userKey }], deletedAt: null } },
            { $addFields: { partnerKey: { $cond: [{ $eq: ['$senderKey', userKey] }, '$recipientKey', '$senderKey'] } } },
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$partnerKey',
                lastMessage: { $first: '$$ROOT' },
                messageCount: { $sum: 1 },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: [ { $type: '$messageStatus' }, 'missing' ] },
                                    { $eq: [ { $size: { $ifNull: ['$messageStatus', []] } }, 0 ] },
                                    {
                                        $not: {
                                            $in: [
                                                'read',
                                                {
                                                    $map: {
                                                        input: { $ifNull: ['$messageStatus', []] },
                                                        as: 's',
                                                        in: {
                                                            $cond: [ { $eq: ['$$s.userKey', userKey] }, '$$s.status', null ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            } },
            { $project: { _id: 0, partnerKey: '$_id', lastMessage: 1, messageCount: 1, unreadCount: 1 } },
            { $facet: {
                items: [ { $skip: skip }, { $limit: limit } ],
                total: [ { $count: 'count' } ]
            } },
            { $project: {
                items: 1,
                total: { $ifNull: [ { $arrayElemAt: ['$total.count', 0] }, 0 ] }
            } }
        ];

        const [result] = await this.chatMessageModel.aggregate(pipeline).exec();
        return { items: result?.items || [], total: result?.total || 0 };
    }

    // Override create method to add logging
    public async create(document: Partial<ChatMessageDocument>): Promise<ChatMessageDocument> {
        try {
            console.log('🔍 ChatMessageRepository.create called with:', JSON.stringify(document, null, 2));
            
            const createdDocument = new this.chatMessageModel(document);
            const result = await createdDocument.save();
            
            console.log('✅ ChatMessageRepository.create success:', result._id);
            return result;
        } catch (error) {
            console.error('❌ ChatMessageRepository.create error:', error);
            throw error;
        }
    }

    // Message status methods
    public async updateMessageStatus(
        messageId: string, 
        userKey: string, 
        status: MessageStatus
    ): Promise<ChatMessageDocument | null> {
        try {
            const message = await this.findById(messageId);
            if (!message) {
                return null;
            }

            // Remove existing status for this user
            message.messageStatus = message.messageStatus?.filter(
                s => s.userKey !== userKey
            ) || [];

            // Add new status
            message.messageStatus?.push({
                userKey,
                status,
                timestamp: new Date()
            });

            return await message.save();
        } catch (error) {
            console.error('❌ Update message status error:', error);
            throw error;
        }
    }

    public async getMessageStatus(messageId: string): Promise<any[]> {
        try {
            const message = await this.findById(messageId);
            return message?.messageStatus || [];
        } catch (error) {
            console.error('❌ Get message status error:', error);
            throw error;
        }
    }
}
