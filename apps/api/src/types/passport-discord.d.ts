declare module 'passport-discord' {
    import { Strategy as PassportStrategy } from 'passport';

    export interface Profile {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        discriminator?: string;
        guilds?: Array<{ id: string; name: string }>;
        provider: string;
    }

    export interface StrategyOptions {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[];
    }

    export type VerifyCallback = (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: any) => void
    ) => void;

    export class Strategy extends PassportStrategy {
        constructor(options: StrategyOptions, verify: VerifyCallback);
    }
}
