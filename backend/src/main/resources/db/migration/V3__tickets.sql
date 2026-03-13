CREATE TABLE tickets (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID         NOT NULL REFERENCES projects(id)   ON DELETE CASCADE,
    workspace_id  UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    type          VARCHAR(20)  NOT NULL DEFAULT 'TASK'
                               CHECK (type IN ('STORY','BUG','TASK','EPIC')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'BACKLOG'
                               CHECK (status IN ('BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','DONE')),
    priority      VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM'
                               CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    assignee_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
    reporter_id   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    story_points  INTEGER,
    position      INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_project_id      ON tickets(project_id);
CREATE INDEX idx_tickets_workspace_id    ON tickets(workspace_id);
CREATE INDEX idx_tickets_assignee_id     ON tickets(assignee_id);
CREATE INDEX idx_tickets_project_status  ON tickets(project_id, status);
