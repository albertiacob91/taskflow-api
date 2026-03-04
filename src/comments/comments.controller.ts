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
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Create comment (task member/owner)' })
  create(@Req() req: any, @Body() dto: CreateCommentDto) {
    return this.comments.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'List comments for a task (member/owner). Requires taskId.' })
  list(
    @Req() req: any,
    @Query('taskId') taskId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.comments.list(req.user.userId, {
      taskId,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Update comment (author only)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.comments.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Delete comment (author only)' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.comments.remove(id, req.user.userId);
  }
}