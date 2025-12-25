import { Module } from '@nestjs/common';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
    imports: [PrismaModule, StorageModule],
    controllers: [TrashController],
    providers: [TrashService],
    exports: [TrashService],
})
export class TrashModule { }
