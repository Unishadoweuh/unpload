import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider } from './storage.interface';
import { Readable } from 'stream';
import * as Minio from 'minio';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
    private client: Minio.Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
        const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'localhost';
        const port = parseInt(this.configService.get<string>('S3_PORT') || '9000', 10);
        const useSSL = this.configService.get<string>('S3_USE_SSL') === 'true';

        this.client = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey: this.configService.get<string>('S3_ACCESS_KEY') || '',
            secretKey: this.configService.get<string>('S3_SECRET_KEY') || '',
        });

        this.bucket = this.configService.get<string>('S3_BUCKET') || 'unpload';
    }

    async upload(key: string, file: Buffer, mimeType: string): Promise<void> {
        await this.ensureBucket();
        await this.client.putObject(this.bucket, key, file, file.length, {
            'Content-Type': mimeType,
        });
    }

    async download(key: string): Promise<Readable> {
        return await this.client.getObject(this.bucket, key);
    }

    async delete(key: string): Promise<void> {
        await this.client.removeObject(this.bucket, key);
    }

    async exists(key: string): Promise<boolean> {
        try {
            await this.client.statObject(this.bucket, key);
            return true;
        } catch (error: any) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
        return await this.client.presignedGetObject(this.bucket, key, expiresInSeconds);
    }

    async getUsage(): Promise<bigint> {
        let totalSize = BigInt(0);
        const stream = this.client.listObjects(this.bucket, '', true);

        return new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                if (obj.size) {
                    totalSize += BigInt(obj.size);
                }
            });
            stream.on('error', reject);
            stream.on('end', () => resolve(totalSize));
        });
    }

    async getMetadata(key: string): Promise<{ size: number; contentType: string } | null> {
        try {
            const stat = await this.client.statObject(this.bucket, key);
            return {
                size: stat.size,
                contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
            };
        } catch {
            return null;
        }
    }

    private async ensureBucket(): Promise<void> {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket);
        }
    }
}
