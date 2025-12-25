import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { TrashService } from './trash.service';

@ApiTags('trash')
@Controller('api/trash')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrashController {
    constructor(private trashService: TrashService) { }

    @Get()
    @ApiOperation({ summary: 'List items in trash' })
    async list(@CurrentUser() user: User) {
        return this.trashService.listTrash(user.id);
    }

    @Post('files/:id/restore')
    @ApiOperation({ summary: 'Restore a file from trash' })
    async restoreFile(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.trashService.restoreFile(id, user.id);
    }

    @Post('folders/:id/restore')
    @ApiOperation({ summary: 'Restore a folder from trash' })
    async restoreFolder(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.trashService.restoreFolder(id, user.id);
    }

    @Delete('files/:id')
    @ApiOperation({ summary: 'Permanently delete a file' })
    async permanentDeleteFile(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        await this.trashService.permanentDeleteFile(id, user.id);
        return { success: true };
    }

    @Delete('folders/:id')
    @ApiOperation({ summary: 'Permanently delete a folder' })
    async permanentDeleteFolder(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        await this.trashService.permanentDeleteFolder(id, user.id);
        return { success: true };
    }

    @Delete('empty')
    @ApiOperation({ summary: 'Empty entire trash' })
    async emptyTrash(@CurrentUser() user: User) {
        await this.trashService.emptyTrash(user.id);
        return { success: true };
    }
}
