import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityAction } from '@prisma/client';

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    async log(
        userId: string,
        action: ActivityAction,
        details?: Record<string, unknown>,
        request?: { ip?: string; headers?: Record<string, string> },
    ) {
        return this.prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details || null,
                ipAddress: request?.ip || null,
                userAgent: request?.headers?.['user-agent'] || null,
            },
        });
    }

    async getByUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activityLog.count({ where: { userId } }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getRecent(userId: string, limit = 10) {
        return this.prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getAllForAdmin(page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activityLog.count(),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
