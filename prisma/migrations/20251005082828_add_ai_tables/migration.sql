-- CreateTable
CREATE TABLE "ai_messages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "message" TEXT NOT NULL,
    "emoji" VARCHAR(10),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patterns" (
    "user_id" INTEGER NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "avg_steps_per_day" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "most_active_day" VARCHAR(20),
    "most_active_hour" INTEGER,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_goals" INTEGER NOT NULL DEFAULT 0,
    "active_goals" INTEGER NOT NULL DEFAULT 0,
    "completed_goals" INTEGER NOT NULL DEFAULT 0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_patterns_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "ai_messages_user_id_shown_dismissed_idx" ON "ai_messages"("user_id", "shown", "dismissed");

-- CreateIndex
CREATE INDEX "ai_messages_user_id_priority_created_at_idx" ON "ai_messages"("user_id", "priority", "created_at");

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_patterns" ADD CONSTRAINT "user_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
