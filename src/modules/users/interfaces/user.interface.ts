export interface IUser {
    userKey: string;
    userName: string;
    phoneNumber: string;
    fullName: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdById?: string;
    deletedById?: string;
    updatedById?: string;
}
