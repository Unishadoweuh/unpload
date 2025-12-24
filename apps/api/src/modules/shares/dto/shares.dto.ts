import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareVisibility } from '@prisma/client';

export class CreateShareDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fileId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    folderId?: string;

    @ApiPropertyOptional({ enum: ShareVisibility })
    @IsOptional()
    @IsEnum(ShareVisibility)
    visibility?: ShareVisibility;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    maxDownloads?: number;
}

export class UpdateShareDto {
    @ApiPropertyOptional({ enum: ShareVisibility })
    @IsOptional()
    @IsEnum(ShareVisibility)
    visibility?: ShareVisibility;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    expiresAt?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    maxDownloads?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}

export class VerifyShareDto {
    @ApiProperty()
    @IsString()
    password: string;
}
