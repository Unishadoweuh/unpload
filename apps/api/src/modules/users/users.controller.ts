import { Controller, Get, Patch, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('api/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile with quota' })
    async getProfile(@CurrentUser() user: User) {
        const fullUser = await this.usersService.findById(user.id);
        if (fullUser) {
            const { passwordHash, ...result } = fullUser;
            return result;
        }
        return null;
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(
        @CurrentUser() user: User,
        @Body() dto: { name?: string },
    ) {
        await this.usersService.update(user.id, { name: dto.name });
        return { success: true };
    }

    @Patch('me/password')
    @ApiOperation({ summary: 'Change password' })
    async changePassword(
        @CurrentUser() user: User,
        @Body() dto: { currentPassword: string; newPassword: string },
    ) {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser?.passwordHash) {
            throw new BadRequestException('Cannot change password for OAuth accounts');
        }

        const isValid = await bcrypt.compare(dto.currentPassword, fullUser.passwordHash);
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.usersService.update(user.id, { passwordHash: hashedPassword });
        return { success: true };
    }
}

