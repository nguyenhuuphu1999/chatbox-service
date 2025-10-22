import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongeeseRepository } from "src/base/repository/abstract-repository";
import { ChatMessageDocument, ChatMessageEntity } from "src/schemas/chat-message.schema";
import { MessageStatus, MESSAGE_STATUS, IMessageStatusEntry } from "src/shared/constants/message-status.constants";

@Injectable()
export class ChatMessageRepository extends BaseMongeeseRepository<ChatMessageDocument> {
    public constructor(
        @InjectModel(ChatMessageEntity.name)
        private readonly chatMessageModel: Model<ChatMessageDocument>
    ) {
        super(chatMessageModel);
        console.log('ChatMessageRepository initialized with model:', this.chatMessageModel.modelName);
    }

    public async findMessagesBetweenUsers(
        user1Key: string,
        user2Key: string
    ): Promise<ChatMessageDocument[]> {
        return this.chatMessageModel
            .find({ 
                $or: [
                    { senderKey: user1Key, recipientKey: user2Key },
                    { senderKey: user2Key, recipientKey: user1Key }
                ],
                deletedAt: null 
            })
            .sort({ createdAt: -1 })
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


    public async getMessagesBetweenUsersPaginated(
        user1Key: string,
        user2Key: string,
        page: number,
        limit: number
    ): Promise<{ messages: ChatMessageDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const pipeline: any[] = [
            {
                $match: {
                    $or: [
                        { senderKey: user1Key, recipientKey: user2Key },
                        { senderKey: user2Key, recipientKey: user1Key }
                    ],
                    deletedAt: null
                }
            },
            { $sort: { createdAt: -1 } },
            { $facet: {
                messages: [ { $skip: skip }, { $limit: limit } ],
                total: [ { $count: 'count' } ]
            } },
            { $project: {
                messages: 1,
                total: { $ifNull: [ { $arrayElemAt: ['$total.count', 0] }, 0 ] }
            } }
        ];

        const [result] = await this.chatMessageModel.aggregate(pipeline).exec();
        return { 
            messages: result?.messages || [], 
            total: result?.total || 0 
        };
    }

    public async getConversationsByUserPaginated(
        userKey: string,
        page: number,
        limit: number
    ): Promise<{ items: Array<{ partnerKey: string; lastMessage: any; messageCount: number; unreadCount: number }>; total: number; }> {
        const skip = (page - 1) * limit;

        // Build aggregation pipeline for conversation grouping
        const pipeline = this.buildConversationPipeline(userKey, skip, limit);
        
        const [result] = await this.chatMessageModel.aggregate(pipeline).exec();
        return { items: result?.items || [], total: result?.total || 0 };
    }

    /**
     * Build aggregation pipeline for conversation grouping
     * This method handles the complex logic of grouping messages by partner
     * and calculating conversation statistics
     */
    private buildConversationPipeline(userKey: string, skip: number, limit: number): any[] {
        return [
            // Match messages for this user
            { 
                $match: { 
                    $or: [{ senderKey: userKey }, { recipientKey: userKey }], 
                    deletedAt: null 
                } 
            },
            
            // Add partner key field
            { 
                $addFields: { 
                    partnerKey: { 
                        $cond: [
                            { $eq: ['$senderKey', userKey] }, 
                            '$recipientKey', 
                            '$senderKey'
                        ] 
                    } 
                } 
            },
            
            // Sort by creation date (newest first)
            { $sort: { createdAt: -1 } },
            
            // Group by partner and calculate statistics
            { 
                $group: {
                    _id: '$partnerKey',
                    lastMessage: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 },
                    unreadCount: this.buildUnreadCountExpression(userKey)
                } 
            },
            
            // Project final structure
            { 
                $project: { 
                    _id: 0, 
                    partnerKey: '$_id', 
                    lastMessage: 1, 
                    messageCount: 1, 
                    unreadCount: 1 
                } 
            },
            
            // Apply pagination using facet
            { 
                $facet: {
                    items: [ { $skip: skip }, { $limit: limit } ],
                    total: [ { $count: 'count' } ]
                } 
            },
            
            // Final projection
            { 
                $project: {
                    items: 1,
                    total: { $ifNull: [ { $arrayElemAt: ['$total.count', 0] }, 0 ] }
                } 
            }
        ];
    }

    /**
     * Build unread count calculation expression
     * This handles the complex logic for determining unread messages
     */
    private buildUnreadCountExpression(userKey: string): any {
        return {
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
                                                    $cond: [ 
                                                        { $eq: ['$$s.userKey', userKey] }, 
                                                        '$$s.status', 
                                                        null 
                                                    ]
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
        };
    }

    // Override create method to add logging
    public async create(document: Partial<ChatMessageDocument>): Promise<ChatMessageDocument> {
        try {
            console.log('ChatMessageRepository.create called with:', JSON.stringify(document, null, 2));
            
            // Validate the document before creating
            const createdDocument = new this.chatMessageModel(document);
            
            // Try to validate manually
            try {
                await createdDocument.validate();
                console.log('Document validation passed');
            } catch (validationError) {
                console.error('Document validation failed:', validationError);
                throw validationError;
            }
            
            const result = await createdDocument.save();
            
            console.log('ChatMessageRepository.create success:', result._id);
            return result;
        } catch (error) {
            console.error('ChatMessageRepository.create error:', error);
            if (error.name === 'ValidationError') {
                console.error('Validation errors:', error.errors);
            }
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
            console.log(`Updating message status: messageId=${messageId}, userKey=${userKey}, status=${status}`);
            
            // Validate input parameters
            if (!messageId || !userKey || !status) {
                throw new Error('Missing required parameters: messageId, userKey, and status are required');
            }

            // Validate status enum
            const validStatuses = Object.values(MESSAGE_STATUS);
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
            }

            // Use atomic update operation to add new status entry only if different from last status
            const result = await this.chatMessageModel.findOneAndUpdate(
                { 
                    _id: messageId,
                    deletedAt: null, // Only update non-deleted messages
                    // Only update if the last status for this user is different or doesn't exist
                    $or: [
                        { 'messageStatus': { $exists: false } },
                        { 'messageStatus': { $size: 0 } },
                        {
                            $expr: {
                                $ne: [
                                    {
                                        $let: {
                                            vars: {
                                                lastStatus: {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: { $ifNull: ['$messageStatus', []] },
                                                                cond: { $eq: ['$$this.userKey', userKey] }
                                                            }
                                                        },
                                                        -1
                                                    ]
                                                }
                                            },
                                            in: '$$lastStatus.status'
                                        }
                                    },
                                    status
                                ]
                            }
                        }
                    ]
                },
                {
                    $push: {
                        messageStatus: {
                            userKey: userKey,
                            status: status,
                            timestamp: new Date()
                        }
                    },
                    $set: {
                        updatedAt: new Date()
                    }
                },
                { 
                    new: true, // Return updated document
                    runValidators: true // Run schema validation
                }
            ).exec();

            if (!result) {
                console.warn(`Message not found, already deleted, or status already exists: messageId=${messageId}, userKey=${userKey}, status=${status}`);
                return null;
            }

            console.log(`Message status added successfully: messageId=${messageId}, userKey=${userKey}, status=${status}`);
            return result;

        } catch (error) {
            console.error('Update message status error:', error);
            
            // Provide more specific error messages
            if (error.name === 'CastError') {
                throw new Error(`Invalid messageId format: ${messageId}`);
            }
            
            if (error.name === 'ValidationError') {
                throw new Error(`Validation failed: ${error.message}`);
            }
            
            throw error;
        }
    }

    public async getMessageStatus(messageId: string): Promise<IMessageStatusEntry[]> {
        try {
            console.log(`Getting message status: messageId=${messageId}`);
            const message = await this.findById(messageId);
            if (!message) {
                console.warn(`Message not found: messageId=${messageId}`);
                return [];
            }

            const statuses = message.messageStatus || [];
            console.log(`Retrieved ${statuses.length} status entries for message: ${messageId}`);
            return statuses;
        } catch (error) {
            console.error('Get message status error:', error);
            throw error;
        }
    }

    public async getUserMessageStatus(messageId: string, userKey: string): Promise<IMessageStatusEntry | null> {
        try {
            console.log(`Getting user message status: messageId=${messageId}, userKey=${userKey}`);
            
            if (!messageId || !userKey) {
                throw new Error('messageId and userKey are required');
            }

            const message = await this.findById(messageId);
            if (!message) {
                console.warn(`Message not found: messageId=${messageId}`);
                return null;
            }

            const userStatus = message.messageStatus?.find(status => status.userKey === userKey) || null;
            console.log(`Retrieved user status: ${userStatus ? userStatus.status : 'not found'}`);
            return userStatus;
        } catch (error) {
            console.error('Get user message status error:', error);
            throw error;
        }
    }

    public async getMessagesWithStatusForUser(userKey: string, status: MessageStatus): Promise<ChatMessageDocument[]> {
        try {
            console.log(`Getting messages with status for user: userKey=${userKey}, status=${status}`);
            
            if (!userKey || !status) {
                throw new Error('userKey and status are required');
            }

            const messages = await this.chatMessageModel.find({
                'messageStatus.userKey': userKey,
                'messageStatus.status': status,
                deletedAt: null
            }).sort({ createdAt: -1 }).exec();

            console.log(`Found ${messages.length} messages with status ${status} for user ${userKey}`);
            return messages;
        } catch (error) {
            console.error('Get messages with status error:', error);
            throw error;
        }
    }
}
