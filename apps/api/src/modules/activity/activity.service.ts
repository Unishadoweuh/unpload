import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Action types matching Prisma enum
type ActivityActionType =
    | 'UPLOAD' | 'DOWNLOAD' | 'DELETE'
    | 'SHARE_CREATE' | 'SHARE_DELETE'
    | 'FOLDER_CREATE' | 'FOLDER_DELETE'
    | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE';

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    async log(
        userId: string,
        action: ActivityActionType,
        details?: Record<string, unknown>,
        request?: { ip?: string; headers?: Record<string, string> },
    ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
            userId,
            action,
            ipAddress: request?.ip ?? null,
            userAgent: request?.headers?.['user-agent'] ?? null,
        };
        if (details) data.details = details;
        return this.prisma.activityLog.create({ data });
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
