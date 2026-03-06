import { PrismaClient, ProjectRole, Role, TaskPriority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.dev' },
    update: {},
    create: {
      email: 'admin@taskflow.dev',
      name: 'Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.dev' },
    update: {},
    create: {
      email: 'member@taskflow.dev',
      name: 'Member',
      passwordHash,
      role: Role.USER,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@taskflow.dev' },
    update: {},
    create: {
      email: 'viewer@taskflow.dev',
      name: 'Viewer',
      passwordHash,
      role: Role.USER,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      description: 'Production-ready demo project',
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: member.id,
      },
    },
    update: { role: ProjectRole.MEMBER },
    create: {
      projectId: project.id,
      userId: member.id,
      role: ProjectRole.MEMBER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: viewer.id,
      },
    },
    update: { role: ProjectRole.VIEWER },
    create: {
      projectId: project.id,
      userId: viewer.id,
      role: ProjectRole.VIEWER,
    },
  });

  const task = await prisma.task.create({
    data: {
      title: 'Demo Task',
      description: 'This is a sample seeded task',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: project.id,
      createdById: admin.id,
      assignedToId: member.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Seeded comment for demo',
      taskId: task.id,
      authorId: admin.id,
    },
  });

  console.log('Seed completed');
  console.log({
    admin: 'admin@taskflow.dev / Password123!',
    member: 'member@taskflow.dev / Password123!',
    viewer: 'viewer@taskflow.dev / Password123!',
    projectId: project.id,
    taskId: task.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });