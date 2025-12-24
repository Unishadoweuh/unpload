import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: configService.get<string>('DISCORD_CLIENT_ID'),
            clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET'),
            callbackURL: configService.get<string>('DISCORD_CALLBACK_URL'),
            scope: ['identify', 'email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
    ) {
        const email = profile.email || `${profile.id}@discord.user`;
        const username = profile.username;

        return this.authService.validateOAuthUser('DISCORD', {
            id: profile.id,
            email,
            username,
        });
    }
}
