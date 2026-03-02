import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: {
    title: string;
    description?: string;
    projectId: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assignedToId?: string;
  }) {
    // Verifica que el project exista (y no esté borrado)
    const project = await this.prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        createdById: userId,
        status: input.status ?? 'TODO',
        priority: input.priority ?? 'MEDIUM',
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        assignedToId: input.assignedToId ?? undefined,
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

  async findAll(params: {
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    q?: string;
    page: number;
    limit: number;
  }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' } },
              { description: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
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

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, input: any) {
    const existing = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
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

  async remove(id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Task not found');

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}