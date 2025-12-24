import { Readable } from 'stream';

export interface IStorageProvider {
    /**
     * Upload a file to storage
     */
    upload(key: string, file: Buffer, mimeType: string): Promise<void>;

    /**
     * Download a file as a readable stream
     */
    download(key: string): Promise<Readable>;

    /**
     * Delete a file from storage
     */
    delete(key: string): Promise<void>;

    /**
     * Check if a file exists
     */
    exists(key: string): Promise<boolean>;

    /**
     * Get a signed URL for temporary access
     */
    getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;

    /**
     * Get total storage usage in bytes
     */
    getUsage(): Promise<bigint>;

    /**
     * Get file metadata
     */
    getMetadata(key: string): Promise<{ size: number; contentType: string } | null>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
