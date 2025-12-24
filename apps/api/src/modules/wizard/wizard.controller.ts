import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WizardService } from './wizard.service';
import { DatabaseConfigDto, StorageConfigDto, SmtpConfigDto, AdminConfigDto, BrandingConfigDto } from './dto/wizard.dto';

@ApiTags('wizard')
@Controller('api/wizard')
export class WizardController {
    constructor(private wizardService: WizardService) { }

    @Get('status')
    @ApiOperation({ summary: 'Get wizard status' })
    async getStatus() {
        return this.wizardService.getStatus();
    }

    @Post('database')
    @ApiOperation({ summary: 'Test database connection' })
    async testDatabase(@Body() dto: DatabaseConfigDto) {
        return this.wizardService.testDatabase(dto);
    }

    @Post('storage')
    @ApiOperation({ summary: 'Configure storage' })
    async configureStorage(@Body() dto: StorageConfigDto) {
        return this.wizardService.configureStorage(dto);
    }

    @Post('smtp')
    @ApiOperation({ summary: 'Configure SMTP' })
    async configureSmtp(@Body() dto: SmtpConfigDto) {
        return this.wizardService.configureSmtp(dto);
    }

    @Post('admin')
    @ApiOperation({ summary: 'Create admin account' })
    async createAdmin(@Body() dto: AdminConfigDto) {
        return this.wizardService.createAdmin(dto);
    }

    @Post('branding')
    @ApiOperation({ summary: 'Configure branding' })
    async configureBranding(@Body() dto: BrandingConfigDto) {
        return this.wizardService.configureBranding(dto);
    }

    @Post('complete')
    @ApiOperation({ summary: 'Complete setup wizard' })
    async complete() {
        return this.wizardService.completeSetup();
    }
}
