import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/settings.dto';

@ApiTags('settings')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all settings' })
    async getAll() {
        return this.settingsService.getAll();
    }

    @Get(':key')
    @ApiOperation({ summary: 'Get specific setting' })
    async get(@Param('key') key: string) {
        const value = await this.settingsService.get(key);
        return { key, value };
    }

    @Put(':key')
    @ApiOperation({ summary: 'Update setting' })
    async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
        await this.settingsService.set(key, dto.value, dto.category || 'general');
        return { success: true };
    }

    @Post('reload')
    @ApiOperation({ summary: 'Reload settings from database' })
    async reload() {
        await this.settingsService.reload();
        return { success: true };
    }
}
