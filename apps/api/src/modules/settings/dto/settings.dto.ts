import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
    @ApiProperty()
    @IsNotEmpty()
    value: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;
}
