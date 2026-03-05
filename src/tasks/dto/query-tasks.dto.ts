import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsDateString,
} from 'class-validator';

export enum TaskSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  dueDate = 'dueDate',
  priority = 'priority',
  status = 'status',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export enum UserFilter {
  me = 'me',
}

const toInt = ({ value }: { value: any }) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export class QueryTasksDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Project id (required)' })
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional({ enum: ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'] as const)
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'] as const)
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional({
    description: 'Assigned to filter. Use "me" or a userId (uuid).',
    example: 'me',
  })
  @IsOptional()
  @IsString()
  assignedTo?: string; // "me" | uuid

  @ApiPropertyOptional({
    description: 'Created by filter. Use "me" or a userId (uuid).',
    example: 'me',
  })
  @IsOptional()
  @IsString()
  createdBy?: string; // "me" | uuid

  @ApiPropertyOptional({ description: 'Due date from (ISO)' })
  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @ApiPropertyOptional({ description: 'Due date to (ISO)' })
  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @ApiPropertyOptional({ description: 'Search in title/description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ enum: TaskSortBy, default: TaskSortBy.createdAt })
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy: TaskSortBy = TaskSortBy.createdAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.desc;
}