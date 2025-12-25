import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Headers,
    UseGuards,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SharesService } from './shares.service';
import { CreateShareDto, UpdateShareDto, VerifyShareDto } from './dto/shares.dto';

@ApiTags('shares')
@Controller('api/shares')
export class SharesController {
    constructor(private sharesService: SharesService) { }

    // Authenticated endpoints
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List user shares' })
    async list(@CurrentUser() user: User) {
        return this.sharesService.findByUser(user.id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create share' })
    async create(@CurrentUser() user: User, @Body() dto: CreateShareDto) {
        return this.sharesService.create({
            userId: user.id,
            fileId: dto.fileId,
            folderId: dto.folderId,
            visibility: dto.visibility,
            password: dto.password,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            maxDownloads: dto.maxDownloads,
        });
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update share' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: UpdateShareDto,
    ) {
        return this.sharesService.update(id, user.id, {
            visibility: dto.visibility,
            password: dto.password,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            maxDownloads: dto.maxDownloads,
            enabled: dto.enabled,
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete share' })
    async delete(@Param('id') id: string, @CurrentUser() user: User) {
        await this.sharesService.delete(id, user.id);
        return { success: true };
    }

    // Public endpoints
    @Get(':slug')
    @ApiOperation({ summary: 'Get public share info' })
    async getPublic(@Param('slug') slug: string) {
        const share = await this.sharesService.findBySlug(slug);
        if (!share) {
            return { error: 'Share not found' };
        }

        // Don't expose sensitive info
        return {
            slug: share.slug,
            visibility: share.visibility,
            hasPassword: !!share.passwordHash,
            expiresAt: share.expiresAt,
            file: share.file ? { name: share.file.name, size: share.file.size, mimeType: share.file.mimeType } : null,
            folder: share.folder ? { name: share.folder.name } : null,
        };
    }

    @Post(':slug/verify')
    @ApiOperation({ summary: 'Verify share password' })
    async verify(@Param('slug') slug: string, @Body() dto: VerifyShareDto) {
        const valid = await this.sharesService.verifyPassword(slug, dto.password);
        return { valid };
    }

    @Get(':slug/download')
    @ApiOperation({ summary: 'Download shared file' })
    async download(
        @Param('slug') slug: string,
        @Headers('x-share-password') password: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, file } = await this.sharesService.download(slug, password || undefined);

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
            'Content-Length': file.size.toString(),
        });

        return new StreamableFile(stream);
    }
}
