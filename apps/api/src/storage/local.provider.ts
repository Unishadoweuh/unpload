import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider } from './storage.interface';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
    private readonly basePath: string;

    constructor(private configService: ConfigService) {
        this.basePath = this.configService.get<string>('STORAGE_PATH') || '/data/uploads';
    }

    private getFullPath(key: string): string {
        return path.join(this.basePath, key);
    }

    async upload(key: string, file: Buffer, _mimeType: string): Promise<void> {
        const fullPath = this.getFullPath(key);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, file);
    }

    async download(key: string): Promise<Readable> {
        const fullPath = this.getFullPath(key);
        return createReadStream(fullPath);
    }

    async delete(key: string): Promise<void> {
        const fullPath = this.getFullPath(key);
        try {
            await fs.unlink(fullPath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async exists(key: string): Promise<boolean> {
        const fullPath = this.getFullPath(key);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async getSignedUrl(key: string, _expiresInSeconds: number): Promise<string> {
        // For local storage, we return a relative path
        // The actual URL generation would be handled by the API endpoint
        return `/api/files/download/${key}`;
    }

    async getUsage(): Promise<bigint> {
        return this.calculateDirSize(this.basePath);
    }

    async getMetadata(key: string): Promise<{ size: number; contentType: string } | null> {
        const fullPath = this.getFullPath(key);
        try {
            const stat = await fs.stat(fullPath);
            return {
                size: stat.size,
                contentType: 'application/octet-stream', // Local FS doesn't store content type
            };
        } catch {
            return null;
        }
    }

    private async calculateDirSize(dirPath: string): Promise<bigint> {
        let totalSize = BigInt(0);

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    totalSize += await this.calculateDirSize(entryPath);
                } else if (entry.isFile()) {
                    const stat = await fs.stat(entryPath);
                    totalSize += BigInt(stat.size);
                }
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        return totalSize;
    }
}
