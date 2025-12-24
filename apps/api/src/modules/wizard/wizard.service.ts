import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UsersService } from '../users/users.service';
import { WizardStatus, WizardStep, DatabaseConfig, StorageConfig, SmtpConfig, AdminConfig, BrandingConfig } from '@unpload/shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WizardService {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private usersService: UsersService,
    ) { }

    async getStatus(): Promise<WizardStatus> {
        const completed = await this.settingsService.isSetupComplete();
        return { completed };
    }

    async testDatabase(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
        try {
            // Since we're using the existing connection, just test it
            await this.prisma.$queryRaw`SELECT 1`;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async configureStorage(config: StorageConfig): Promise<{ success: boolean; error?: string }> {
        try {
            await this.settingsService.set('storage_type', config.type, 'storage');

            if (config.type === 'local') {
                await this.settingsService.set('storage_path', config.localPath || '/data/uploads', 'storage');
            } else {
                await this.settingsService.set('s3_endpoint', config.s3Endpoint, 'storage');
                await this.settingsService.set('s3_bucket', config.s3Bucket, 'storage');
                await this.settingsService.set('s3_access_key', config.s3AccessKey, 'storage');
                await this.settingsService.set('s3_secret_key', config.s3SecretKey, 'storage');
                await this.settingsService.set('s3_region', config.s3Region || 'us-east-1', 'storage');
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async configureSmtp(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
        try {
            await this.settingsService.set('smtp_host', config.host, 'email');
            await this.settingsService.set('smtp_port', config.port, 'email');
            await this.settingsService.set('smtp_user', config.user || '', 'email');
            await this.settingsService.set('smtp_password', config.password || '', 'email');
            await this.settingsService.set('smtp_from', config.from, 'email');
            await this.settingsService.set('smtp_secure', config.secure || false, 'email');

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async createAdmin(config: AdminConfig): Promise<{ success: boolean; error?: string }> {
        try {
            const existingAdmin = await this.prisma.user.findFirst({
                where: { role: 'ADMIN' },
            });

            if (existingAdmin) {
                return { success: false, error: 'Admin user already exists' };
            }

            const passwordHash = await bcrypt.hash(config.password, 12);
            await this.usersService.create({
                email: config.email,
                name: config.name,
                passwordHash,
            });

            // The first user is automatically made admin by UsersService

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async configureBranding(config: BrandingConfig): Promise<{ success: boolean; error?: string }> {
        try {
            await this.settingsService.set('app_name', config.appName, 'general');
            if (config.primaryColor) {
                await this.settingsService.set('primary_color', config.primaryColor, 'general');
            }
            if (config.logoUrl) {
                await this.settingsService.set('app_logo', config.logoUrl, 'general');
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async completeSetup(): Promise<{ success: boolean }> {
        await this.settingsService.initDefaults();
        await this.settingsService.markSetupComplete();
        return { success: true };
    }
}
