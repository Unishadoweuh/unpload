import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { Share, ShareVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { LIMITS } from '@unpload/shared';

interface CreateShareData {
    userId: string;
    fileId?: string;
    folderId?: string;
    visibility?: ShareVisibility;
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
}

@Injectable()
export class SharesService {
    constructor(
        private prisma: PrismaService,
        private filesService: FilesService,
    ) { }

    async create(data: CreateShareData): Promise<Share> {
        const slug = nanoid(LIMITS.SLUG_LENGTH);
        const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;

        return this.prisma.share.create({
            data: {
                slug,
                userId: data.userId,
                fileId: data.fileId,
                folderId: data.folderId,
                visibility: data.visibility || 'PUBLIC',
                passwordHash,
                expiresAt: data.expiresAt,
                maxDownloads: data.maxDownloads,
            },
        });
    }

    async findByUser(userId: string) {
        return this.prisma.share.findMany({
            where: { userId },
            include: {
                file: { select: { id: true, name: true, size: true, mimeType: true } },
                folder: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.share.findUnique({
            where: { slug },
            include: {
                user: { select: { id: true, enabled: true } },
                file: true,
                folder: { include: { files: true } },
            },
        });
    }

    async verifyPassword(slug: string, password: string): Promise<boolean> {
        const share = await this.findBySlug(slug);
        if (!share || !share.passwordHash) {
            return false;
        }
        return bcrypt.compare(password, share.passwordHash);
    }

    async validateAccess(slug: string, password?: string) {
        const share = await this.findBySlug(slug);

        if (!share) {
            throw new NotFoundException('Share not found');
        }

        if (!share.enabled) {
            throw new ForbiddenException('Share is disabled');
        }

        // Block access if owner account is disabled
        if (share.user && !share.user.enabled) {
            throw new ForbiddenException('Share owner account is disabled');
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            throw new ForbiddenException('Share has expired');
        }

        if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
            throw new ForbiddenException('Download limit reached');
        }

        if (share.passwordHash) {
            if (!password) {
                throw new UnauthorizedException('Password required');
            }
            const valid = await bcrypt.compare(password, share.passwordHash);
            if (!valid) {
                throw new UnauthorizedException('Invalid password');
            }
        }

        return share;
    }

    async download(slug: string, password?: string): Promise<{ stream: Readable; file: any }> {
        const share = await this.validateAccess(slug, password);

        if (!share.fileId) {
            throw new ForbiddenException('Cannot download folder shares directly');
        }

        // Increment download count
        await this.prisma.share.update({
            where: { id: share.id },
            data: { downloadCount: { increment: 1 } },
        });

        return this.filesService.download(share.fileId);
    }

    async update(id: string, userId: string, data: Partial<{
        visibility: ShareVisibility;
        password: string | null;
        expiresAt: Date | null;
        maxDownloads: number | null;
        enabled: boolean;
    }>): Promise<Share> {
        const share = await this.prisma.share.findUnique({ where: { id } });

        if (!share) {
            throw new NotFoundException('Share not found');
        }

        if (share.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        const updateData: any = { ...data };
        if (data.password !== undefined) {
            updateData.passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
            delete updateData.password;
        }

        return this.prisma.share.update({
            where: { id },
            data: updateData,
        });
    }

    async delete(id: string, userId: string): Promise<void> {
        const share = await this.prisma.share.findUnique({ where: { id } });

        if (!share) {
            throw new NotFoundException('Share not found');
        }

        if (share.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.share.delete({ where: { id } });
    }

    async incrementViewCount(id: string): Promise<void> {
        await this.prisma.share.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }
}
