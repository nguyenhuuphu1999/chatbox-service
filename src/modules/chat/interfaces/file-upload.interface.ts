export interface UploadChunkRequest {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: Buffer;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface UploadChunkResponse {
  success: boolean;
  progress: number;
  url?: string;
  error?: string;
}

export interface UploadCompleteData {
  fileId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}
