/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupGoalProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GroupGoal" DROP CONSTRAINT "GroupGoal_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupGoalProgress" DROP CONSTRAINT "GroupGoalProgress_groupGoalId_fkey";

-- DropForeignKey
ALTER TABLE "GroupGoalProgress" DROP CONSTRAINT "GroupGoalProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMessage" DROP CONSTRAINT "GroupMessage_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMessage" DROP CONSTRAINT "GroupMessage_userId_fkey";

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "GroupGoal";

-- DropTable
DROP TABLE "GroupGoalProgress";

-- DropTable
DROP TABLE "GroupMember";

-- DropTable
DROP TABLE "GroupMessage";

-- CreateTable
CREATE TABLE "workspaces" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "position" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_goals" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" INTEGER NOT NULL,
    "category" TEXT,
    "owner_id" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'workspace',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "team_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_goal_contributors" (
    "id" SERIAL NOT NULL,
    "team_goal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "contribution" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "team_goal_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_goal_steps" (
    "id" SERIAL NOT NULL,
    "team_goal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_goal_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "invited_by" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_messages" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "team_goals_workspace_id_idx" ON "team_goals"("workspace_id");

-- CreateIndex
CREATE INDEX "team_goals_owner_id_idx" ON "team_goals"("owner_id");

-- CreateIndex
CREATE INDEX "team_goal_contributors_user_id_idx" ON "team_goal_contributors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_goal_contributors_team_goal_id_user_id_key" ON "team_goal_contributors"("team_goal_id", "user_id");

-- CreateIndex
CREATE INDEX "team_goal_steps_team_goal_id_idx" ON "team_goal_steps"("team_goal_id");

-- CreateIndex
CREATE INDEX "team_goal_steps_user_id_idx" ON "team_goal_steps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invites_token_key" ON "workspace_invites"("token");

-- CreateIndex
CREATE INDEX "workspace_invites_email_idx" ON "workspace_invites"("email");

-- CreateIndex
CREATE INDEX "workspace_invites_token_idx" ON "workspace_invites"("token");

-- CreateIndex
CREATE INDEX "workspace_messages_workspace_id_idx" ON "workspace_messages"("workspace_id");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goals" ADD CONSTRAINT "team_goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goals" ADD CONSTRAINT "team_goals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goal_contributors" ADD CONSTRAINT "team_goal_contributors_team_goal_id_fkey" FOREIGN KEY ("team_goal_id") REFERENCES "team_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goal_contributors" ADD CONSTRAINT "team_goal_contributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goal_steps" ADD CONSTRAINT "team_goal_steps_team_goal_id_fkey" FOREIGN KEY ("team_goal_id") REFERENCES "team_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_goal_steps" ADD CONSTRAINT "team_goal_steps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_messages" ADD CONSTRAINT "workspace_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_messages" ADD CONSTRAINT "workspace_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
