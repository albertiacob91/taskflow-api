-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'COMMENT_CREATED', 'COMMENT_UPDATED', 'COMMENT_DELETED', 'MEMBER_ADDED', 'MEMBER_REMOVED');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "commentId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_projectId_createdAt_idx" ON "ActivityLog"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
