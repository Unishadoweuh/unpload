import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SETTING_KEYS } from '@unpload/shared';

@Injectable()
export class SettingsService implements OnModuleInit {
    private cache: Map<string, any> = new Map();

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.reload();
    }

    async reload(): Promise<void> {
        const settings = await this.prisma.setting.findMany();
        this.cache.clear();
        for (const setting of settings) {
            this.cache.set(setting.key, setting.value);
        }
    }

    async get<T = any>(key: string): Promise<T | null> {
        if (this.cache.has(key)) {
            return this.cache.get(key) as T;
        }

        const setting = await this.prisma.setting.findUnique({ where: { key } });
        if (setting) {
            this.cache.set(key, setting.value);
            return setting.value as T;
        }

        return null;
    }

    async set(key: string, value: any, category: string): Promise<void> {
        await this.prisma.setting.upsert({
            where: { key },
            update: { value, category },
            create: { key, value, category },
        });
        this.cache.set(key, value);
    }

    async getAll() {
        const settings = await this.prisma.setting.findMany();
        return settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {} as Record<string, any>);
    }

    async getByCategory(category: string) {
        const settings = await this.prisma.setting.findMany({
            where: { category },
        });
        return settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {} as Record<string, any>);
    }

    async initDefaults(): Promise<void> {
        const defaults: Record<string, { value: any; category: string }> = {
            [SETTING_KEYS.APP_NAME]: { value: 'UnPload', category: 'general' },
            [SETTING_KEYS.PRIMARY_COLOR]: { value: '#6366f1', category: 'general' },
            [SETTING_KEYS.ALLOW_REGISTRATION]: { value: true, category: 'security' },
            [SETTING_KEYS.MAX_FILE_SIZE]: { value: 104857600, category: 'limits' }, // 100MB
            [SETTING_KEYS.DEFAULT_QUOTA]: { value: 5368709120, category: 'limits' }, // 5GB
        };

        for (const [key, { value, category }] of Object.entries(defaults)) {
            const existing = await this.prisma.setting.findUnique({ where: { key } });
            if (!existing) {
                await this.set(key, value, category);
            }
        }
    }

    isSetupComplete(): Promise<boolean> {
        return this.get<boolean>('setup_complete').then((v) => v === true);
    }

    async markSetupComplete(): Promise<void> {
        await this.set('setup_complete', true, 'system');
    }
}
