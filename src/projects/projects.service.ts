import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, input: { name: string; description?: string }) {
    return this.prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(params: { q?: string; page: number; limit: number }) {
    const { q, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.project.count({ where }),
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
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, ownerId: string, input: { name?: string; description?: string }) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Not allowed');

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, ownerId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Not allowed');

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}