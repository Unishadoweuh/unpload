import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.interface';
import { LocalStorageProvider } from './local.provider';
import { S3StorageProvider } from './s3.provider';

@Global()
@Module({
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useFactory: (configService: ConfigService) => {
                const storageType = configService.get<string>('STORAGE_TYPE') || 'local';

                if (storageType === 's3') {
                    return new S3StorageProvider(configService);
                }

                return new LocalStorageProvider(configService);
            },
            inject: [ConfigService],
        },
    ],
    exports: [STORAGE_PROVIDER],
})
export class StorageModule { }
