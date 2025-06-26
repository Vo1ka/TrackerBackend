-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subtask" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;
