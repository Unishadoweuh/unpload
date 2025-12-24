import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Folder } from '@prisma/client';

@Injectable()
export class FoldersService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, name: string, parentId?: string): Promise<Folder> {
        return this.prisma.folder.create({
            data: {
                userId,
                name,
                parentId,
            },
        });
    }

    async findByUser(userId: string, parentId?: string | null) {
        return this.prisma.folder.findMany({
            where: {
                userId,
                parentId: parentId ?? null,
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string): Promise<Folder | null> {
        return this.prisma.folder.findUnique({
            where: { id },
            include: {
                files: true,
                children: true,
            },
        });
    }

    async rename(id: string, userId: string, newName: string): Promise<Folder> {
        const folder = await this.findById(id);

        if (!folder) {
            throw new NotFoundException('Folder not found');
        }

        if (folder.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.folder.update({
            where: { id },
            data: { name: newName },
        });
    }

    async delete(id: string, userId: string): Promise<void> {
        const folder = await this.findById(id);

        if (!folder) {
            throw new NotFoundException('Folder not found');
        }

        if (folder.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        // Cascade delete is handled by Prisma
        await this.prisma.folder.delete({
            where: { id },
        });
    }
}
