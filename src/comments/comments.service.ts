import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async getCommentOrThrow(commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true, authorId: true, taskId: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async getTaskProjectIdOrThrow(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task.projectId;
  }

  async create(userId: string, dto: CreateCommentDto) {
    const projectId = await this.getTaskProjectIdOrThrow(dto.taskId);
    await this.projects.assertMemberOrOwner(projectId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId: dto.taskId,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        taskId: true,
        authorId: true,
        createdAt: true,
      },
    });

    await this.activity.log({
      type: ActivityType.COMMENT_CREATED,
      actorId: userId,
      projectId,
      commentId: comment.id,
      taskId: dto.taskId,
    });

    this.realtime.emitProjectEvent(projectId, 'comment.created', comment);

    return comment;
  }

  async list(
    userId: string,
    query: { taskId?: string; page: number; limit: number },
  ) {
    const { taskId, page, limit } = query;

    if (!taskId) throw new ForbiddenException('taskId is required');

    const projectId = await this.getTaskProjectIdOrThrow(taskId);
    await this.projects.assertMemberOrOwner(projectId, userId);

    const skip = (page - 1) * limit;

    const where = { deletedAt: null, taskId };

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.getCommentOrThrow(commentId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only author allowed');
    }

    const projectId = await this.getTaskProjectIdOrThrow(comment.taskId);
    await this.projects.assertMemberOrOwner(projectId, userId);

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
    });

    await this.activity.log({
      type: ActivityType.COMMENT_UPDATED,
      actorId: userId,
      projectId,
      commentId,
      taskId: comment.taskId,
    });

    return updated;
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.getCommentOrThrow(commentId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only author allowed');
    }

    const projectId = await this.getTaskProjectIdOrThrow(comment.taskId);
    await this.projects.assertMemberOrOwner(projectId, userId);

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    await this.activity.log({
      type: ActivityType.COMMENT_DELETED,
      actorId: userId,
      projectId,
      commentId,
      taskId: comment.taskId,
    });

    return { ok: true };
  }
}