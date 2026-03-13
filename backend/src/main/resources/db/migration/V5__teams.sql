CREATE TABLE project_teams (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workspace_id UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    color        VARCHAR(30)  NOT NULL DEFAULT 'blue',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_team_name UNIQUE (project_id, name)
);

ALTER TABLE tickets ADD COLUMN team_id UUID REFERENCES project_teams(id) ON DELETE SET NULL;

CREATE INDEX idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
