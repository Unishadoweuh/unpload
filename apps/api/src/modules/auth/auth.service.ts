import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthTokens, JwtPayload } from '@unpload/shared';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.passwordHash) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async register(dto: RegisterDto): Promise<AuthTokens> {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Check if this is the first user - make them admin
        const userCount = await this.usersService.count();
        const isFirstUser = userCount === 0;

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            role: isFirstUser ? 'ADMIN' : 'USER',
        });

        return this.generateTokens(user);
    }

    async login(dto: LoginDto): Promise<AuthTokens> {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user);
    }

    async validateOAuthUser(
        provider: 'DISCORD' | 'GOOGLE' | 'GITHUB',
        profile: { id: string; email: string; username: string },
    ): Promise<User> {
        let user = await this.usersService.findByOAuth(provider, profile.id);

        if (!user) {
            // Check if user exists with same email
            user = await this.usersService.findByEmail(profile.email);

            if (user) {
                // Link OAuth to existing account
                user = await this.usersService.linkOAuth(user.id, provider, profile.id);
            } else {
                // Create new user
                user = await this.usersService.create({
                    email: profile.email,
                    name: profile.username,
                    oauthProvider: provider,
                    oauthId: profile.id,
                });
            }
        }

        return user;
    }

    async generateTokens(user: User): Promise<AuthTokens> {
        const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
            sub: user.id,
            email: user.email,
            role: user.role as any,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
        });

        return { accessToken, refreshToken };
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        try {
            const payload = this.jwtService.verify<JwtPayload>(refreshToken);
            const user = await this.usersService.findById(payload.sub);

            if (!user) {
                throw new UnauthorizedException();
            }

            return this.generateTokens(user);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
