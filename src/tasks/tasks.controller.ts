import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskPriorityDto, TaskStatusDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiOkResponse({ description: 'Create task' })
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user.userId, dto as any);
  }

  @Get()
  @ApiOkResponse({ description: 'List tasks (paginated + filters)' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatusDto })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriorityDto })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: any,
    @Query('priority') priority?: any,
    @Query('assignedToId') assignedToId?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.tasks.findAll({
      projectId,
      status,
      priority,
      assignedToId,
      q,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(50, Math.max(1, Number(limit) || 10)),
    });
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get task by id' })
  findOne(@Param('id') id: string) {
    return this.tasks.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto as any);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Soft delete task' })
  remove(@Param('id') id: string) {
    return this.tasks.remove(id);
  }
}