import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum TaskStatusDto {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Login using JWT', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'c0a8012a-3f3e-4a6b-9f22-1b4a5a6a7b8c' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({ enum: TaskStatusDto, required: false, default: TaskStatusDto.TODO })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @ApiProperty({ enum: TaskPriorityDto, required: false, default: TaskPriorityDto.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @ApiProperty({ required: false, description: 'ISO date string' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiProperty({ required: false, description: 'User id to assign task' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}