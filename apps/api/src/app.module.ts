import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { FoldersModule } from './modules/folders/folders.module';
import { SharesModule } from './modules/shares/shares.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WizardModule } from './modules/wizard/wizard.module';
import { TrashModule } from './modules/trash/trash.module';
import { ActivityModule } from './modules/activity/activity.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
        StorageModule,
        AuthModule,
        UsersModule,
        FilesModule,
        FoldersModule,
        SharesModule,
        AdminModule,
        SettingsModule,
        WizardModule,
        TrashModule,
        ActivityModule,
        HealthModule,
    ],
})
export class AppModule { }

