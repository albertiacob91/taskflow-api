import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  @ApiOkResponse({ description: 'Create comment' })
  create(@Req() req: any, @Body() dto: CreateCommentDto) {
    return this.comments.create(req.user.userId, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List comments (paginated)' })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('taskId') taskId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.comments.findAll({
      taskId,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(50, Math.max(1, Number(limit) || 10)),
    });
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Update comment (author only)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.comments.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Soft delete comment (author only)' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.comments.remove(id, req.user.userId);
  }
}