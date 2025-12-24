import { Module } from '@nestjs/common';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { FilesModule } from '../files/files.module';

@Module({
    imports: [FilesModule],
    controllers: [SharesController],
    providers: [SharesService],
    exports: [SharesService],
})
export class SharesModule { }
