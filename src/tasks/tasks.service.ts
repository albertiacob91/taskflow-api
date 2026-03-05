import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
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
        updatedAt: true,
      },
    });
  }

  async list(userId: string, query: QueryTasksDto) {
    // QueryTasksDto ya valida projectId como required, pero mantenemos guardrail:
    if (!query.projectId) throw new ForbiddenException('projectId is required');

    await this.projects.assertMemberOrOwner(query.projectId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      projectId: query.projectId,
    };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.dueFrom || query.dueTo) {
      where.dueDate = {};
      if (query.dueFrom) where.dueDate.gte = new Date(query.dueFrom);
      if (query.dueTo) where.dueDate.lte = new Date(query.dueTo);
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {
      [query.sortBy ?? 'createdAt']: query.order ?? 'desc',
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
          updatedAt: true,
        },
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