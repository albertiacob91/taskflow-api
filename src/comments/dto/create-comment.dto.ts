import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This task needs more details.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({ example: 'c0a8012a-3f3e-4a6b-9f22-1b4a5a6a7b8c' })
  @IsUUID()
  taskId!: string;
}