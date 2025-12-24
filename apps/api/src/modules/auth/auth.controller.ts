import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Req,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout current user' })
    async logout() {
        // In a stateless JWT implementation, we just return success
        // For stateful sessions, we would invalidate the token here
        return;
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async me(@CurrentUser() user: User) {
        const { passwordHash, ...result } = user;
        return result;
    }

    @Get('oauth/discord')
    @UseGuards(DiscordAuthGuard)
    @ApiOperation({ summary: 'Initiate Discord OAuth flow' })
    async discordAuth() {
        // Guard redirects to Discord
    }

    @Get('oauth/discord/callback')
    @UseGuards(DiscordAuthGuard)
    @ApiOperation({ summary: 'Discord OAuth callback' })
    async discordCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as User;
        const tokens = await this.authService.generateTokens(user);

        // Redirect to frontend with tokens
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        res.redirect(
            `${appUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
        );
    }
}
