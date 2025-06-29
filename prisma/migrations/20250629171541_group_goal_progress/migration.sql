-- CreateTable
CREATE TABLE "GroupGoalProgress" (
    "id" SERIAL NOT NULL,
    "groupGoalId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupGoalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupGoalProgress_groupGoalId_userId_key" ON "GroupGoalProgress"("groupGoalId", "userId");

-- AddForeignKey
ALTER TABLE "GroupGoalProgress" ADD CONSTRAINT "GroupGoalProgress_groupGoalId_fkey" FOREIGN KEY ("groupGoalId") REFERENCES "GroupGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupGoalProgress" ADD CONSTRAINT "GroupGoalProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
