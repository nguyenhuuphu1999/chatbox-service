import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongeeseRepository } from "src/base/repository/abstract-repository";
import { UserDocument, UserEntity } from "src/schemas/user.schema";

@Injectable()
export class UserRepository extends BaseMongeeseRepository<UserDocument> {
    public constructor(
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserDocument>
    ) {
        super(userModel);
    }

    public async findByUserKey(userKey: string): Promise<UserDocument | null> {
        return this.findOne({ userKey });
    }

    public async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
        return this.findOne({ phoneNumber });
    }

    public async updateOnlineStatus(userId: string, isOnline: boolean): Promise<UserDocument | null> {
        return this.updateById(userId, { 
            isOnline, 
            lastSeen: isOnline ? undefined : new Date() 
        });
    }
}
