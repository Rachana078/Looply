ALTER TABLE workspaces
    DROP CONSTRAINT workspaces_owner_id_fkey;

ALTER TABLE workspaces
    ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
