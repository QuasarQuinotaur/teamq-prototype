-- Multi-stage service requests: ServiceRequest -> ServiceRequestWorkflow + ServiceRequestStage.
-- Preserves existing ServiceRequest ids as both workflow id and stage id (same numeric ids in separate tables).

CREATE TABLE "ServiceRequestWorkflow" (
    "id" SERIAL NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "ServiceRequestWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRequestStage" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDue" TIMESTAMP(3),
    "description" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'to-do',
    "title" TEXT,

    CONSTRAINT "ServiceRequestStage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceRequestStage" ADD CONSTRAINT "ServiceRequestStage_status_check" CHECK ("status" IN ('to-do', 'done'));

CREATE INDEX "ServiceRequestWorkflow_ownerId_idx" ON "ServiceRequestWorkflow"("ownerId");

CREATE INDEX "ServiceRequestStage_workflowId_idx" ON "ServiceRequestStage"("workflowId");

CREATE UNIQUE INDEX "ServiceRequestStage_workflowId_stageOrder_key" ON "ServiceRequestStage"("workflowId", "stageOrder");

ALTER TABLE "ServiceRequestWorkflow" ADD CONSTRAINT "ServiceRequestWorkflow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceRequestStage" ADD CONSTRAINT "ServiceRequestStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ServiceRequestWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ServiceRequestWorkflow" ("id", "dateCreated", "title", "ownerId")
SELECT "id", "dateCreated", "title", "ownerId"
FROM "ServiceRequest";

INSERT INTO "ServiceRequestStage" ("id", "workflowId", "stageOrder", "dateCreated", "dateDue", "description", "priority", "status", "title")
SELECT "id", "id", 1, "dateCreated", "dateDue", "description", "priority", "status", "title"
FROM "ServiceRequest";

SELECT setval(pg_get_serial_sequence('"ServiceRequestWorkflow"', 'id'), COALESCE((SELECT MAX("id") FROM "ServiceRequestWorkflow"), 1));

SELECT setval(pg_get_serial_sequence('"ServiceRequestStage"', 'id'), COALESCE((SELECT MAX("id") FROM "ServiceRequestStage"), 1));

CREATE TABLE "_StageAssignees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StageAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_StageAssignees_B_index" ON "_StageAssignees"("B");

CREATE TABLE "_StageContents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StageContents_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_StageContents_B_index" ON "_StageContents"("B");

INSERT INTO "_StageAssignees" ("A", "B") SELECT "A", "B" FROM "_EmployeeRequests";

INSERT INTO "_StageContents" ("A", "B") SELECT "A", "B" FROM "_ContentRequests";

ALTER TABLE "_StageAssignees" ADD CONSTRAINT "_StageAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StageAssignees" ADD CONSTRAINT "_StageAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceRequestStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StageContents" ADD CONSTRAINT "_StageContents_A_fkey" FOREIGN KEY ("A") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StageContents" ADD CONSTRAINT "_StageContents_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceRequestStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest" DROP CONSTRAINT IF EXISTS "ServiceRequest_ownerId_fkey";

ALTER TABLE "_EmployeeRequests" DROP CONSTRAINT IF EXISTS "_EmployeeRequests_A_fkey";

ALTER TABLE "_EmployeeRequests" DROP CONSTRAINT IF EXISTS "_EmployeeRequests_B_fkey";

ALTER TABLE "_ContentRequests" DROP CONSTRAINT IF EXISTS "_ContentRequests_A_fkey";

ALTER TABLE "_ContentRequests" DROP CONSTRAINT IF EXISTS "_ContentRequests_B_fkey";

DROP TABLE "_EmployeeRequests";

DROP TABLE "_ContentRequests";

DROP TABLE "ServiceRequest";
