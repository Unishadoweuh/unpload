import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IStorageProvider, STORAGE_PROVIDER } from '../../storage/storage.interface';

@Injectable()
export class TrashService {
    constructor(
        private prisma: PrismaService,
        @Inject(STORAGE_PROVIDER) private storage: IStorageProvider,
    ) { }

    async listTrash(userId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [files, folders] = await Promise.all([
            this.prisma.file.findMany({
                where: {
                    userId,
                    deletedAt: { not: null, gte: thirtyDaysAgo },
                },
                orderBy: { deletedAt: 'desc' },
            }),
            this.prisma.folder.findMany({
                where: {
                    userId,
                    deletedAt: { not: null, gte: thirtyDaysAgo },
                },
                orderBy: { deletedAt: 'desc' },
            }),
        ]);

        // Combine and format for frontend
        const items = [
            ...files.map(f => ({
                id: f.id,
                name: f.name,
                type: 'file' as const,
                size: f.size,
                mimeType: f.mimeType,
                deletedAt: f.deletedAt?.toISOString(),
                expiresAt: f.deletedAt ? new Date(f.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            })),
            ...folders.map(f => ({
                id: f.id,
                name: f.name,
                type: 'folder' as const,
                size: undefined,
                mimeType: undefined,
                deletedAt: f.deletedAt?.toISOString(),
                expiresAt: f.deletedAt ? new Date(f.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            })),
        ];

        return items.sort((a, b) =>
            new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
        );
    }

    async restoreFile(fileId: string, userId: string) {
        const file = await this.prisma.file.findFirst({
            where: { id: fileId, userId, deletedAt: { not: null } },
        });

        if (!file) {
            throw new NotFoundException('File not found in trash');
        }

        return this.prisma.file.update({
            where: { id: fileId },
            data: { deletedAt: null },
        });
    }

    async restoreFolder(folderId: string, userId: string) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, userId, deletedAt: { not: null } },
        });

        if (!folder) {
            throw new NotFoundException('Folder not found in trash');
        }

        return this.prisma.folder.update({
            where: { id: folderId },
            data: { deletedAt: null },
        });
    }

    async permanentDeleteFile(fileId: string, userId: string) {
        const file = await this.prisma.file.findFirst({
            where: { id: fileId, userId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Delete from storage
        await this.storage.delete(file.storageKey);

        // Update user quota
        await this.prisma.quota.update({
            where: { userId },
            data: { usedBytes: { decrement: file.size } },
        });

        // Delete from database
        await this.prisma.file.delete({ where: { id: fileId } });
    }

    async permanentDeleteFolder(folderId: string, userId: string) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, userId },
        });

        if (!folder) {
            throw new NotFoundException('Folder not found');
        }

        // Recursively delete all files in folder
        await this.deleteFilesInFolder(folderId, userId);

        // Delete folder
        await this.prisma.folder.delete({ where: { id: folderId } });
    }

    private async deleteFilesInFolder(folderId: string, userId: string) {
        const files = await this.prisma.file.findMany({
            where: { folderId },
        });

        for (const file of files) {
            await this.storage.delete(file.storageKey);
            await this.prisma.quota.update({
                where: { userId },
                data: { usedBytes: { decrement: file.size } },
            });
        }

        await this.prisma.file.deleteMany({ where: { folderId } });

        // Delete subfolders
        const subfolders = await this.prisma.folder.findMany({
            where: { parentId: folderId },
        });

        for (const subfolder of subfolders) {
            await this.deleteFilesInFolder(subfolder.id, userId);
            await this.prisma.folder.delete({ where: { id: subfolder.id } });
        }
    }

    async emptyTrash(userId: string) {
        const files = await this.prisma.file.findMany({
            where: { userId, deletedAt: { not: null } },
        });

        // Delete all files in trash
        for (const file of files) {
            await this.storage.delete(file.storageKey);
            await this.prisma.quota.update({
                where: { userId },
                data: { usedBytes: { decrement: file.size } },
            });
        }

        await this.prisma.file.deleteMany({
            where: { userId, deletedAt: { not: null } },
        });

        // Delete all folders in trash
        await this.prisma.folder.deleteMany({
            where: { userId, deletedAt: { not: null } },
        });
    }
}
