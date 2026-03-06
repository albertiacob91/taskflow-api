import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class ActivityService {
  constructor(
  private readonly prisma: PrismaService,
  @Inject(forwardRef(() => ProjectsService))
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

  async list(userId: string, projectId: string, page: number, limit: number) {
    await this.projects.assertMemberOrOwner(projectId, userId);

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { projectId },
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
      this.prisma.activityLog.count({
        where: { projectId },
      }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }
}