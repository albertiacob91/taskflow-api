import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  private async getTaskOrThrow(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true, createdById: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    await this.projects.assertMemberOrOwner(dto.projectId, userId);

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status ?? undefined,
        priority: dto.priority ?? undefined,
        dueDate: dto.dueDate ?? null,
        projectId: dto.projectId,
        createdById: userId,
        assignedToId: dto.assignedToId ?? null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        createdById: true,
        assignedToId: true,
        createdAt: true,
      },
    });
  }

  async list(
    userId: string,
    query: {
      projectId?: string;
      status?: string;
      priority?: string;
      page: number;
      limit: number;
    },
  ) {
    const { projectId, status, priority, page, limit } = query;

    if (!projectId) {
      throw new ForbiddenException('projectId is required');
    }

    await this.projects.assertMemberOrOwner(projectId, userId);

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      projectId,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.getTaskOrThrow(taskId);

    await this.projects.assertMemberOrOwner(task.projectId, userId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        status: dto.status ?? undefined,
        priority: dto.priority ?? undefined,
        dueDate: dto.dueDate ?? undefined,
        assignedToId: dto.assignedToId ?? undefined,
      },
    });
  }

  async remove(taskId: string, userId: string) {
    const task = await this.getTaskOrThrow(taskId);

    await this.projects.assertMemberOrOwner(task.projectId, userId);

    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    return { ok: true };
  }
}