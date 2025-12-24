import { IsString, IsOptional, IsEnum, IsEmail, MinLength, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DatabaseConfigDto {
    @ApiProperty({ example: 'postgresql://user:pass@localhost:5432/db' })
    @IsString()
    url: string;
}

export class StorageConfigDto {
    @ApiProperty({ enum: ['local', 's3'] })
    @IsEnum(['local', 's3'])
    type: 'local' | 's3';

    @ApiPropertyOptional({ example: '/data/uploads' })
    @IsOptional()
    @IsString()
    localPath?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    s3Endpoint?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    s3Bucket?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    s3AccessKey?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    s3SecretKey?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    s3Region?: string;
}

export class SmtpConfigDto {
    @ApiProperty({ example: 'smtp.example.com' })
    @IsString()
    host: string;

    @ApiProperty({ example: 587 })
    @IsInt()
    port: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password?: string;

    @ApiProperty({ example: 'noreply@example.com' })
    @IsString()
    from: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    secure?: boolean;
}

export class AdminConfigDto {
    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePassword123' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'Admin User' })
    @IsString()
    name: string;
}

export class BrandingConfigDto {
    @ApiProperty({ example: 'My UnPload' })
    @IsString()
    appName: string;

    @ApiPropertyOptional({ example: '#6366f1' })
    @IsOptional()
    @IsString()
    primaryColor?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logoUrl?: string;
}
