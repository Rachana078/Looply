package com.flowdesk.repository;

import com.flowdesk.domain.Project;
import com.flowdesk.domain.ProjectTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, UUID> {
    List<ProjectTeam> findByProjectOrderByCreatedAtAsc(Project project);
    boolean existsByProjectAndName(Project project, String name);
}
