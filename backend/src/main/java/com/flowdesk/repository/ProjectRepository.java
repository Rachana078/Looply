package com.flowdesk.repository;

import com.flowdesk.domain.Project;
import com.flowdesk.domain.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByWorkspace(Workspace workspace);
    Optional<Project> findByWorkspaceAndKey(Workspace workspace, String key);
    boolean existsByWorkspaceAndKey(Workspace workspace, String key);
}
