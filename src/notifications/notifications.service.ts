import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    type: NotificationType;
    userId: string;
    actorId: string;
    projectId: string;
    taskId?: string | null;
    commentId?: string | null;
    meta?: Prisma.InputJsonValue;
  }) {
    if (data.userId === data.actorId) return null;

    return this.prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        actorId: data.actorId,
        projectId: data.projectId,
        taskId: data.taskId ?? null,
        commentId: data.commentId ?? null,
        meta: data.meta ?? undefined,
      },
    });
  }

  async list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Forbidden');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { ok: true };
  }
}