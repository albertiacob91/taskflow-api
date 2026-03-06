-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER';
