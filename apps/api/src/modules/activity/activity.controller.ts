import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('api/activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
    constructor(private activityService: ActivityService) { }

    @Get()
    @ApiOperation({ summary: 'Get current user activity log' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getMyActivity(
        @CurrentUser() user: { id: string },
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityService.getByUser(
            user.id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get recent activity (last 10 actions)' })
    async getRecentActivity(@CurrentUser() user: { id: string }) {
        return this.activityService.getRecent(user.id);
    }

    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get all activity logs (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllActivity(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityService.getAllForAdmin(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
        );
    }
}
