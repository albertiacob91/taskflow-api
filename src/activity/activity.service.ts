import { Injectable, ForbiddenException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async log(data: {
    type: ActivityType;
    actorId: string;
    projectId: string;
    taskId?: string | null;
    commentId?: string | null;
    meta?: Prisma.InputJsonValue;
  }) {
    return this.prisma.activityLog.create({
      data: {
        type: data.type,
        actorId: data.actorId,
        projectId: data.projectId,
        taskId: data.taskId ?? null,
        commentId: data.commentId ?? null,
        meta: data.meta ?? undefined,
      },
    });
  }

  private buildWhere(base: Prisma.ActivityLogWhereInput, query: QueryActivityDto) {
    const where: Prisma.ActivityLogWhereInput = {
      ...base,
    };

    if (query.type) where.type = query.type;
    if (query.actorId) where.actorId = query.actorId;

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    return where;
  }

  async listProjectActivity(
    userId: string,
    projectId: string,
    query: QueryActivityDto,
  ) {
    await this.projects.assertMemberOrOwner(projectId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere({ projectId }, query);

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
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
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async listMyActivity(userId: string, query: QueryActivityDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere({ actorId: userId }, query);

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
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
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async listUserActivity(requestUserId: string, targetUserId: string, query: QueryActivityDto) {
    const requestUser = await this.prisma.user.findFirst({
      where: { id: requestUserId, deletedAt: null },
      select: { role: true },
    });

    if (!requestUser || requestUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere({ actorId: targetUserId }, query);

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
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
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }
}