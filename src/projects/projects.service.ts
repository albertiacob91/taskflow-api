import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
  private readonly prisma: PrismaService,
  @Inject(forwardRef(() => ActivityService))
  private readonly activity: ActivityService,
) {}

  private async getProjectOrThrow(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async assertOwner(projectId: string, userId: string) {
    const project = await this.getProjectOrThrow(projectId);
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only owner allowed');
    }
    return project;
  }

  async assertMemberOrOwner(projectId: string, userId: string) {
    const project = await this.getProjectOrThrow(projectId);

    if (project.ownerId === userId) return project;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { userId: true },
    });

    if (!member) throw new ForbiddenException('Not a project member');
    return project;
  }

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
      },
    });

    await this.activity.log({
      type: ActivityType.PROJECT_CREATED,
      actorId: userId,
      projectId: project.id,
      meta: { name: project.name },
    });

    return project;
  }

  async list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.assertOwner(projectId, userId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
      },
    });

    await this.activity.log({
      type: ActivityType.PROJECT_UPDATED,
      actorId: userId,
      projectId,
      meta: { name: project.name },
    });

    return project;
  }

  async remove(projectId: string, userId: string) {
    await this.assertOwner(projectId, userId);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    await this.activity.log({
      type: ActivityType.PROJECT_DELETED,
      actorId: userId,
      projectId,
    });

    return { ok: true };
  }

  async addMember(projectId: string, ownerId: string, dto: AddProjectMemberDto) {
    await this.assertOwner(projectId, ownerId);

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true, email: true, name: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const project = await this.getProjectOrThrow(projectId);
    if (project.ownerId === user.id) {
      return {
        ok: true,
        member: { id: user.id, email: user.email, name: user.name },
      };
    }

    await this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: {},
      create: { projectId, userId: user.id },
    });

    await this.activity.log({
      type: ActivityType.MEMBER_ADDED,
      actorId: ownerId,
      projectId,
      meta: { memberId: user.id, email: user.email },
    });

    return {
      ok: true,
      member: { id: user.id, email: user.email, name: user.name },
    };
  }

  async listMembers(projectId: string, userId: string) {
    await this.assertMemberOrOwner(projectId, userId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        owner: { select: { id: true, email: true, name: true } },
        members: {
          select: {
            user: { select: { id: true, email: true, name: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    return {
      owner: project.owner,
      members: project.members.map((m) => ({
        ...m.user,
        addedAt: m.createdAt,
      })),
    };
  }

  async removeMember(projectId: string, ownerId: string, memberUserId: string) {
    await this.assertOwner(projectId, ownerId);

    const project = await this.getProjectOrThrow(projectId);
    if (project.ownerId === memberUserId) {
      throw new ForbiddenException('Cannot remove owner');
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberUserId } },
    });

    await this.activity.log({
      type: ActivityType.MEMBER_REMOVED,
      actorId: ownerId,
      projectId,
      meta: { memberId: memberUserId },
    });

    return { ok: true };
  }
}