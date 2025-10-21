import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ORDER_BY } from "./base.dto";

export class PagingResponseDto<T> {
    @IsArray()
    public list: T[];

    @IsNumber()
    public currentPage: number;

    @IsNumber()
    public totalPages: number;

    @IsNumber()
    @IsOptional()
    public totalItems?: number;

    public constructor(data: T[], currentPage: number, pageSize: number, totalItem?: number) {
        this.list = data;
        this.currentPage = pageSize && pageSize > 0 ? currentPage : 1;
        this.totalPages = pageSize && pageSize > 0 ? Math.ceil(totalItem / pageSize) : 1;
        this.totalItems = totalItem;
    }
}

export class PagingRequestDto {
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    public page: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    public pageSize: number;

    @IsOptional()
    @IsString()
    public sortType?: string;

    @IsOptional()
    @IsEnum(ORDER_BY)
    public sortBy?: ORDER_BY;

    public get skip(): number {
        if (!this.pageSize) {
            return 0;
        }
        return (this.page - 1) *  this.pageSize;
    }

    public constructor(page?: number, pageSize?: number) {
        this.page = page || 1;
        this.pageSize = pageSize || 10;
    }
}