import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserDto, UpdateQuotaDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get system statistics' })
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('storage')
    @ApiOperation({ summary: 'Get storage information' })
    async getStorage() {
        return this.adminService.getStorageInfo();
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    async getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.adminService.getAllUsers(page, limit);
    }

    @Patch('users/:id')
    @ApiOperation({ summary: 'Update user' })
    async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.adminService.updateUser(id, dto);
    }

    @Patch('users/:id/quota')
    @ApiOperation({ summary: 'Update user quota' })
    async updateQuota(@Param('id') id: string, @Body() dto: UpdateQuotaDto) {
        return this.adminService.updateUserQuota(id, BigInt(dto.maxBytes));
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete user' })
    async deleteUser(@Param('id') id: string) {
        await this.adminService.deleteUser(id);
        return { success: true };
    }
}
