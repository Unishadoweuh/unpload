import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenameFileDto {
    @ApiProperty({ example: 'new-filename.txt' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class MoveFileDto {
    @ApiPropertyOptional({ example: 'folder-uuid' })
    @IsOptional()
    @IsString()
    folderId?: string | null;
}
