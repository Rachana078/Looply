-- Add OPEN status between TODO and IN_PROGRESS
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
    CHECK (status IN ('BACKLOG','TODO','OPEN','IN_PROGRESS','IN_REVIEW','DONE'));
