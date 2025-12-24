import { Module } from '@nestjs/common';
import { WizardService } from './wizard.service';
import { WizardController } from './wizard.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [WizardController],
    providers: [WizardService],
})
export class WizardModule { }
