import {
    Model,
    FilterQuery,
    UpdateQuery,
    ClientSession,
    Document,
    Types
} from 'mongoose';
import { ResponsePaging } from './response';


export abstract class BaseMongeeseRepository<T extends Document> {
    protected constructor(protected readonly model: Model<T>) {}

    public async create(
        document: Partial<T>,
        session?: ClientSession
    ): Promise<T> {
        const createdDocument = new this.model(document);
        return await createdDocument.save({ session });
    }

    public async findById(
        id: string,
        sort?: Record<string, 1 | -1>
    ): Promise<T | null> { 
        const data = await this.model
            .findById(id)
            .sort(sort || { createdAt: -1 })
            .exec();
        return data;
    }

    public async findOne(
        filter: FilterQuery<T>,
        projection?: any | null,
        sort?: Record<string, 1 | -1>
    ): Promise<T | null> { 
        return await this.model
            .findOne({ ...filter, deletedAt: null }, projection)
            .sort(sort || { createdAt: -1 })
            .exec();
    }

    public async findAll(
        filter: FilterQuery<T> = {},
        projection?: any | null,
        sort?: Record<string, 1 | -1>,
        lean: boolean = false
    ): Promise<T[]> { 
        const query = this.model
            .find({ ...filter, deletedAt: null }, projection)
            .sort(sort || { createdAt: -1 })

        return lean ? query.lean() : query.exec();
    }

    public async updateById(
        id: string,
        update: UpdateQuery<T>,
        session?: ClientSession
    ): Promise<T | null> {
        return this.model
            .findByIdAndUpdate(id, update, { new: true, session })
            .exec();
    }

    public async update(
        filter: FilterQuery<T>,
        update: UpdateQuery<T>,
        session?: ClientSession
    ): Promise<T | null> {
        await this.model
            .updateOne({ ...filter, deletedAt: null }, update, { new: true, session })
            .exec();
        return this.findOne(filter);
    }

    public async deleteById(
        id: string,
        session?: ClientSession
    ): Promise<T | null> {
        return this.model.findByIdAndDelete(id, { session }).exec();
    }

    public async softDelete(
        input: {
            id: Types.ObjectId,
            deletedById?: string,
            session?: ClientSession
        }
    ): Promise<T | null> {
        const {id, deletedById, session} = input;
        return this.model.findOneAndUpdate({_id: id}, { deletedAt: new Date(), deletedById }, { new: true, session }).exec();
    }

    public async deleteMany(
        filter: FilterQuery<T>,
        session?: ClientSession
    ): Promise<number> {
        const result = await this.model.deleteMany(filter, { session }).exec();
        return result.deletedCount || 0;
    }

    public async count(filter: FilterQuery<T> = {}): Promise<number> {
        return this.model.countDocuments({...filter, deletedAt: null}).exec();
    }

    public async findWithPagination<E>(
        filter: FilterQuery<T>,
        page: number = 1,
        limit: number = 10,
        projection?: any | null,
        sort?: Record<string, 1 | -1>
    ): Promise<ResponsePaging<E | T>> { 
        const skip = (Number(page) - 1) * Number(limit);
        const [resp, count] = await Promise.all([
            this.model
                .find({...filter, deletedAt: null}, projection)
                .sort(sort || { createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .exec(),
            this.model.countDocuments({...filter, deletedAt: null}).exec(),
        ]);

        const totalPage = Math.ceil(count / Number(limit));

        return {
            totalData: count,
            totalPage: totalPage,
            currentPage: String(page),
            perPage: String(limit),
            data: resp,
        };
    }
}

