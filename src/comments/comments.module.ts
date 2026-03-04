import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule, ProjectsModule], 
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}