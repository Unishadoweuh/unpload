import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { FilesService } from './files.service';
import { RenameFileDto, MoveFileDto } from './dto/files.dto';

@ApiTags('files')
@Controller('api/files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
    constructor(private filesService: FilesService) { }

    @Get()
    @ApiOperation({ summary: 'List user files' })
    async list(
        @CurrentUser() user: User,
        @Query('folderId') folderId?: string,
    ) {
        return this.filesService.findByUser(user.id, folderId);
    }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiOperation({ summary: 'Upload files' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                folderId: { type: 'string' },
            },
        },
    })
    async upload(
        @CurrentUser() user: User,
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folderId') folderId?: string,
    ) {
        const results = await Promise.all(
            files.map((file) =>
                this.filesService.upload({
                    userId: user.id,
                    folderId,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    buffer: file.buffer,
                }),
            ),
        );
        return results;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get file metadata' })
    async getOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.filesService.findById(id);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download file' })
    async download(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, file } = await this.filesService.download(id, user.id);

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
            'Content-Length': file.size.toString(),
        });

        return new StreamableFile(stream);
    }

    @Get(':id/preview')
    @ApiOperation({ summary: 'Preview file (images, PDFs)' })
    async preview(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, file } = await this.filesService.download(id, user.id);

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
        });

        return new StreamableFile(stream);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Rename file' })
    async rename(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: RenameFileDto,
    ) {
        return this.filesService.rename(id, user.id, dto.name);
    }

    @Post(':id/move')
    @ApiOperation({ summary: 'Move file to folder' })
    async move(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: MoveFileDto,
    ) {
        return this.filesService.move(id, user.id, dto.folderId ?? null);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete file' })
    async delete(@Param('id') id: string, @CurrentUser() user: User) {
        await this.filesService.delete(id, user.id);
        return { success: true };
    }
}
