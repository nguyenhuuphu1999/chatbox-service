import { Types } from "mongoose";

export interface IBase {
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdById?: string;
    updatedById?: string;
    deletedById?: string;
}

