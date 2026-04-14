-- Service requests only use statuses: to-do, done
UPDATE "ServiceRequest"
SET status = 'done'
WHERE LOWER(TRIM(status)) IN ('completed', 'complete');

UPDATE "ServiceRequest"
SET status = 'to-do'
WHERE status NOT IN ('to-do', 'done');

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_status_check" CHECK (status IN ('to-do', 'done'));
