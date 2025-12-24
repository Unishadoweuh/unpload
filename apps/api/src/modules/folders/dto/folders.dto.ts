import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
    @ApiProperty({ example: 'My Folder' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'parent-folder-uuid' })
    @IsOptional()
    @IsString()
    parentId?: string;
}

export class RenameFolderDto {
    @ApiProperty({ example: 'New Folder Name' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
