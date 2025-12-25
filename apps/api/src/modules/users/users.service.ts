import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OAuthProvider, User } from '@prisma/client';
import { LIMITS } from '@unpload/shared';

interface CreateUserData {
    email: string;
    name: string;
    passwordHash?: string;
    oauthProvider?: OAuthProvider;
    oauthId?: string;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { quota: true },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByOAuth(provider: OAuthProvider, oauthId: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { oauthProvider: provider, oauthId },
        });
    }

    async create(data: CreateUserData): Promise<User> {
        // Check if this is the first user (make them admin)
        const userCount = await this.prisma.user.count();
        const isFirstUser = userCount === 0;

        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash: data.passwordHash,
                oauthProvider: data.oauthProvider,
                oauthId: data.oauthId,
                role: isFirstUser ? 'ADMIN' : 'USER',
                quota: {
                    create: {
                        maxBytes: BigInt(LIMITS.DEFAULT_QUOTA),
                    },
                },
            },
        });
    }

    async linkOAuth(userId: string, provider: OAuthProvider, oauthId: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { oauthProvider: provider, oauthId },
        });
    }

    async updateQuotaUsage(userId: string, bytesChange: bigint): Promise<void> {
        await this.prisma.quota.update({
            where: { userId },
            data: {
                usedBytes: {
                    increment: bytesChange,
                },
            },
        });
    }

    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                include: { quota: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);

        return {
            data: users.map(({ passwordHash, ...user }) => user),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async update(id: string, data: Partial<{ name: string; role: 'ADMIN' | 'USER'; enabled: boolean }>) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async updateQuota(userId: string, maxBytes: bigint) {
        return this.prisma.quota.update({
            where: { userId },
            data: { maxBytes },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }
}
