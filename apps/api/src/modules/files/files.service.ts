import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IStorageProvider, STORAGE_PROVIDER } from '../../storage/storage.interface';
import { UsersService } from '../users/users.service';
import { File } from '@prisma/client';
import { createHash } from 'crypto';
import { Readable } from 'stream';

interface UploadFileData {
    userId: string;
    folderId?: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
}

@Injectable()
export class FilesService {
    constructor(
        private prisma: PrismaService,
        @Inject(STORAGE_PROVIDER) private storage: IStorageProvider,
        private usersService: UsersService,
    ) { }

    async upload(data: UploadFileData): Promise<File> {
        const { userId, folderId, originalName, mimeType, buffer } = data;
        const size = BigInt(buffer.length);

        // Check quota
        const user = await this.usersService.findById(userId);
        if (user?.quota) {
            const newUsage = user.quota.usedBytes + size;
            if (newUsage > user.quota.maxBytes) {
                throw new ForbiddenException('Storage quota exceeded');
            }
        }

        // Calculate checksum
        const checksum = createHash('sha256').update(buffer).digest('hex');

        // Create file record first to get ID
        const file = await this.prisma.file.create({
            data: {
                userId,
                folderId,
                name: originalName,
                originalName,
                mimeType,
                size,
                storagePath: '', // Will update after upload
                checksum,
            },
        });

        // Upload to storage
        const storagePath = `users/${userId}/${file.id}`;
        await this.storage.upload(storagePath, buffer, mimeType);

        // Update storage path
        const updatedFile = await this.prisma.file.update({
            where: { id: file.id },
            data: { storagePath },
        });

        // Update user quota
        await this.usersService.updateQuotaUsage(userId, size);

        return updatedFile;
    }

    async findByUser(userId: string, folderId?: string | null) {
        return this.prisma.file.findMany({
            where: {
                userId,
                folderId: folderId ?? null,
                deletedAt: null, // Exclude soft-deleted files
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string): Promise<File | null> {
        return this.prisma.file.findUnique({
            where: { id },
        });
    }

    async download(id: string, userId?: string): Promise<{ stream: Readable; file: File }> {
        const file = await this.prisma.file.findUnique({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (userId && file.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        const stream = await this.storage.download(file.storagePath);
        return { stream, file };
    }

    async rename(id: string, userId: string, newName: string): Promise<File> {
        const file = await this.findById(id);

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.file.update({
            where: { id },
            data: { name: newName },
        });
    }

    async move(id: string, userId: string, folderId: string | null): Promise<File> {
        const file = await this.findById(id);

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.file.update({
            where: { id },
            data: { folderId },
        });
    }

    async delete(id: string, userId: string): Promise<void> {
        const file = await this.findById(id);

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        // Soft delete - just set deletedAt timestamp
        await this.prisma.file.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
