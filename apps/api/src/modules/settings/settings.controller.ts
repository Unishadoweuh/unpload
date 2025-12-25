import { Controller, Get, Put, Post, Param, Body, UseGuards, UseInterceptors, UploadedFile, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/settings.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';

@ApiTags('settings')
@Controller('api/settings')
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all settings' })
    async getAll() {
        return this.settingsService.getAll();
    }

    // IMPORTANT: Put specific routes BEFORE the :key param route!

    @Get('logo/image')
    @ApiOperation({ summary: 'Get application logo (public)' })
    async getLogo(@Res({ passthrough: true }) res: Response): Promise<StreamableFile | null> {
        const logoPath = await this.settingsService.get('logo_path');

        if (!logoPath) {
            res.status(404);
            return null;
        }

        try {
            const ext = path.extname(logoPath as string).toLowerCase();
            const mimeTypes: Record<string, string> = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.webp': 'image/webp',
            };

            res.set({
                'Content-Type': mimeTypes[ext] || 'image/png',
                'Cache-Control': 'public, max-age=86400',
            });

            const stream = createReadStream(logoPath as string);
            return new StreamableFile(stream);
        } catch {
            res.status(404);
            return null;
        }
    }

    @Post('logo')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('logo'))
    @ApiOperation({ summary: 'Upload application logo' })
    @ApiConsumes('multipart/form-data')
    async uploadLogo(@UploadedFile() file: Express.Multer.File) {
        const logoDir = '/data/uploads/branding';
        await fs.mkdir(logoDir, { recursive: true });

        const ext = path.extname(file.originalname) || '.png';
        const logoPath = path.join(logoDir, `logo${ext}`);

        await fs.writeFile(logoPath, file.buffer);

        // Save logo path in settings
        await this.settingsService.set('logo_path', logoPath, 'branding');
        await this.settingsService.set('logo_enabled', true, 'branding');

        return { success: true, path: logoPath };
    }

    @Post('reload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reload settings from database' })
    async reload() {
        await this.settingsService.reload();
        return { success: true };
    }

    // Generic key route MUST come LAST because :key captures everything
    @Get(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get specific setting' })
    async get(@Param('key') key: string) {
        const value = await this.settingsService.get(key);
        return { key, value };
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update setting' })
    async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
        await this.settingsService.set(key, dto.value, dto.category || 'general');
        return { success: true };
    }
}
