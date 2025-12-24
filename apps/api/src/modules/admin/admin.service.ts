import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { IStorageProvider, STORAGE_PROVIDER } from '../../storage/storage.interface';
import { SystemStats } from '@unpload/shared';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
        @Inject(STORAGE_PROVIDER) private storage: IStorageProvider,
    ) { }

    async getStats(): Promise<SystemStats> {
        const [totalUsers, totalFiles, totalShares, activeShares] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.file.count(),
            this.prisma.share.count(),
            this.prisma.share.count({
                where: {
                    enabled: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
            }),
        ]);

        const totalStorageUsed = await this.storage.getUsage();

        return {
            totalUsers,
            totalFiles,
            totalShares,
            activeShares,
            totalStorageUsed,
        };
    }

    async getStorageInfo() {
        const totalUsed = await this.storage.getUsage();
        const quotaStats = await this.prisma.quota.aggregate({
            _sum: { maxBytes: true, usedBytes: true },
        });

        return {
            totalUsed,
            totalAllocated: quotaStats._sum.maxBytes || BigInt(0),
            totalUsedByQuota: quotaStats._sum.usedBytes || BigInt(0),
        };
    }

    async getAllUsers(page = 1, limit = 20) {
        return this.usersService.findAll(page, limit);
    }

    async updateUser(id: string, data: { name?: string; role?: 'ADMIN' | 'USER' }) {
        return this.usersService.update(id, data);
    }

    async updateUserQuota(userId: string, maxBytes: bigint) {
        return this.usersService.updateQuota(userId, maxBytes);
    }

    async deleteUser(id: string) {
        return this.usersService.delete(id);
    }
}
