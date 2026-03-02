import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: { content: string; taskId: string }) {
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.comment.create({
      data: {
        content: input.content,
        taskId: input.taskId,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        taskId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(params: { taskId?: string; page: number; limit: number }) {
    const { taskId, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(taskId ? { taskId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          taskId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.comment.count({ where }),
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

  async update(id: string, userId: string, input: { content?: string }) {
    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.authorId !== userId) throw new ForbiddenException('Not allowed');

    return this.prisma.comment.update({
      where: { id },
      data: {
        ...(input.content !== undefined ? { content: input.content } : {}),
      },
      select: {
        id: true,
        content: true,
        taskId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.authorId !== userId) throw new ForbiddenException('Not allowed');

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}