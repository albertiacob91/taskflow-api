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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
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
  const task = await this.prisma.task.findFirst({
    where: { id: dto.taskId, deletedAt: null },
    select: {
      id: true,
      projectId: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) throw new NotFoundException('Task not found');

  await this.projects.assertMemberOrOwner(task.projectId, userId);

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
    projectId: task.projectId,
    commentId: comment.id,
    taskId: dto.taskId,
  });

  if (task.createdById !== userId) {
    await this.notifications.create({
      type: NotificationType.COMMENT_ADDED,
      userId: task.createdById,
      actorId: userId,
      projectId: task.projectId,
      taskId: task.id,
      commentId: comment.id,
    });
  }

  if (
    task.assignedToId &&
    task.assignedToId !== userId &&
    task.assignedToId !== task.createdById
  ) {
    await this.notifications.create({
      type: NotificationType.COMMENT_ADDED,
      userId: task.assignedToId,
      actorId: userId,
      projectId: task.projectId,
      taskId: task.id,
      commentId: comment.id,
    });
  }

  this.realtime.emitProjectEvent(task.projectId, 'comment.created', comment);

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