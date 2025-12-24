import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { FoldersService } from './folders.service';
import { CreateFolderDto, RenameFolderDto } from './dto/folders.dto';

@ApiTags('folders')
@Controller('api/folders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoldersController {
    constructor(private foldersService: FoldersService) { }

    @Get()
    @ApiOperation({ summary: 'List user folders' })
    async list(@CurrentUser() user: User, @Query('parentId') parentId?: string) {
        return this.foldersService.findByUser(user.id, parentId);
    }

    @Post()
    @ApiOperation({ summary: 'Create folder' })
    async create(@CurrentUser() user: User, @Body() dto: CreateFolderDto) {
        return this.foldersService.create(user.id, dto.name, dto.parentId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get folder with contents' })
    async getOne(@Param('id') id: string) {
        return this.foldersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Rename folder' })
    async rename(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: RenameFolderDto) {
        return this.foldersService.rename(id, user.id, dto.name);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete folder and contents' })
    async delete(@Param('id') id: string, @CurrentUser() user: User) {
        await this.foldersService.delete(id, user.id);
        return { success: true };
    }
}
