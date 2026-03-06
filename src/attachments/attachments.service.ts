import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { unlink } from 'fs/promises';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  private async getTaskOrThrow(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async upload(
    userId: string,
    taskId: string,
    file: Express.Multer.File,
  ) {
    const task = await this.getTaskOrThrow(taskId);

    await this.projects.assertProjectWritable(task.projectId, userId);

    return this.prisma.attachment.create({
      data: {
        originalName: file.originalname,
        storageName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path.replace(/\\/g, '/'),
        taskId,
        uploadedById: userId,
      },
      select: {
        id: true,
        originalName: true,
        storageName: true,
        mimeType: true,
        size: true,
        path: true,
        taskId: true,
        uploadedById: true,
        createdAt: true,
      },
    });
  }

  async list(userId: string, taskId: string) {
    const task = await this.getTaskOrThrow(taskId);

    await this.projects.assertMemberOrOwner(task.projectId, userId);

    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        storageName: true,
        mimeType: true,
        size: true,
        path: true,
        taskId: true,
        uploadedById: true,
        createdAt: true,
      },
    });
  }

  async remove(userId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId },
      select: {
        id: true,
        path: true,
        uploadedById: true,
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.projects.assertProjectWritable(attachment.task.projectId, userId);

    if (attachment.uploadedById !== userId) {
      throw new ForbiddenException('Only uploader can delete attachment');
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    try {
      await unlink(attachment.path);
    } catch {
      // ignore missing file on disk
    }

    return { ok: true };
  }
}