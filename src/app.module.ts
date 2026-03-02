import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

// (si ya tienes módulos, luego los añadimos aquí)
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { ProjectsModule } from './projects/projects.module';

import { TasksModule } from './tasks/tasks.module';

import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    UsersModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}