import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Create task (member or owner)' })
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'List tasks with filters/search/sort (member or owner). projectId required.',
  })
  list(@Req() req: any, @Query() query: QueryTasksDto) {
    return this.tasks.list(req.user.userId, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Update task (member or owner)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Delete task (member or owner)' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasks.remove(id, req.user.userId);
  }
}