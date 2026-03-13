package com.flowdesk.service;

import com.flowdesk.domain.*;
import com.flowdesk.dto.CreateTeamRequest;
import com.flowdesk.dto.TeamResponse;
import com.flowdesk.exception.ProjectNotFoundException;
import com.flowdesk.exception.WorkspaceAccessDeniedException;
import com.flowdesk.repository.ProjectRepository;
import com.flowdesk.repository.ProjectTeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TeamService {

    private final ProjectTeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceService workspaceService;
    private final WorkspaceAuthorizationService authz;

    public TeamService(ProjectTeamRepository teamRepository,
                       ProjectRepository projectRepository,
                       WorkspaceService workspaceService,
                       WorkspaceAuthorizationService authz) {
        this.teamRepository = teamRepository;
        this.projectRepository = projectRepository;
        this.workspaceService = workspaceService;
        this.authz = authz;
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> list(String slug, String projectKey, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        return teamRepository.findByProjectOrderByCreatedAtAsc(project)
                .stream().map(this::toResponse).toList();
    }

    public TeamResponse create(String slug, String projectKey, CreateTeamRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        Project project = findProject(workspace, projectKey);

        if (teamRepository.existsByProjectAndName(project, req.name())) {
            throw new WorkspaceAccessDeniedException("A team with that name already exists in this project");
        }

        ProjectTeam team = new ProjectTeam();
        team.setProject(project);
        team.setWorkspace(workspace);
        team.setName(req.name());
        team.setColor(req.color());
        return toResponse(teamRepository.save(team));
    }

    public void delete(String slug, String projectKey, UUID teamId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        ProjectTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new WorkspaceAccessDeniedException("Team not found"));
        if (!team.getProject().getWorkspace().getId().equals(workspace.getId())) {
            throw new WorkspaceAccessDeniedException("Team not found");
        }
        teamRepository.delete(team);
    }

    private Project findProject(Workspace workspace, String key) {
        return projectRepository.findByWorkspaceAndKey(workspace, key)
                .orElseThrow(() -> new ProjectNotFoundException(key));
    }

    private TeamResponse toResponse(ProjectTeam t) {
        return new TeamResponse(t.getId(), t.getName(), t.getColor());
    }
}
