import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiOkResponse({ description: 'Create project' })
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.projects.create(req.user.userId, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List projects (paginated)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name/description' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.projects.findAll({
      q,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(50, Math.max(1, Number(limit) || 10)),
    });
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get project by id' })
  findOne(@Param('id') id: string) {
    return this.projects.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Update project (owner only)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Soft delete project (owner only)' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.projects.remove(id, req.user.userId);
  }
}