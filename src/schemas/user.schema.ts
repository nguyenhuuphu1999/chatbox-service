import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseEntity } from "src/base/entities/base.entity";
import { IUser } from "src/modules/users/interfaces/user.interface";

export const COLLECTION_USER_NAME = "users";

@Schema({ timestamps: true, collection: COLLECTION_USER_NAME })
export class UserEntity extends BaseEntity implements IUser {
    @Prop({ required: true, unique: true })
    public userKey: string;

    @Prop({ required: true })
    public userName: string;

    @Prop({ required: true, unique: true })
    public phoneNumber: string;

    @Prop({ required: true })
    public fullName: string;

    @Prop({ required: false })
    public avatar?: string;

    @Prop({ default: false })
    public isOnline?: boolean;

    @Prop({ default: null })
    public lastSeen?: Date;
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);
