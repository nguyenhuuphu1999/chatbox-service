export class ResponsePaging<T> {
    data: T[];
    perPage: string;
    totalData: number;
    totalPage?: number;
    currentPage: string;
}

