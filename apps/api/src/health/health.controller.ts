import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    @ApiResponse({ status: 503, description: 'Service is unhealthy' })
    async check() {
        const checks = {
            api: 'ok',
            database: 'unknown',
            timestamp: new Date().toISOString(),
        };

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = 'ok';
        } catch (error) {
            checks.database = 'error';
        }

        const status = checks.database === 'ok' ? 'ok' : 'degraded';

        return {
            status,
            ...checks,
        };
    }
}
