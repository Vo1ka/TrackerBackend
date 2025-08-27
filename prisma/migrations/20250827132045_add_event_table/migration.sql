-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "clientEventId" TEXT,
    "source" TEXT,
    "sphereId" INTEGER,
    "goalId" INTEGER,
    "stepId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS event_idem
ON "Event"("userId","clientEventId")
WHERE "clientEventId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
