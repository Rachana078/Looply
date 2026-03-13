package com.flowdesk.service;

import com.flowdesk.domain.Project;
import com.flowdesk.domain.Workspace;
import com.flowdesk.dto.CreateProjectRequest;
import com.flowdesk.dto.ProjectResponse;
import com.flowdesk.dto.UpdateProjectRequest;
import com.flowdesk.exception.ProjectNotFoundException;
import com.flowdesk.exception.SlugAlreadyExistsException;
import com.flowdesk.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkspaceService workspaceService;
    private final WorkspaceAuthorizationService authz;

    public ProjectService(ProjectRepository projectRepository,
                          WorkspaceService workspaceService,
                          WorkspaceAuthorizationService authz) {
        this.projectRepository = projectRepository;
        this.workspaceService = workspaceService;
        this.authz = authz;
    }

    public ProjectResponse create(String slug, CreateProjectRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);

        if (projectRepository.existsByWorkspaceAndKey(workspace, req.key())) {
            throw new SlugAlreadyExistsException("Project key already exists in this workspace: " + req.key());
        }

        Project project = new Project();
        project.setWorkspace(workspace);
        project.setName(req.name());
        project.setKey(req.key());
        project.setDescription(req.description());
        return toResponse(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAll(String slug, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        return projectRepository.findByWorkspace(workspace).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getByKey(String slug, String key, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = projectRepository.findByWorkspaceAndKey(workspace, key)
                .orElseThrow(() -> new ProjectNotFoundException(key));
        return toResponse(project);
    }

    public ProjectResponse update(String slug, String key, UpdateProjectRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        Project project = projectRepository.findByWorkspaceAndKey(workspace, key)
                .orElseThrow(() -> new ProjectNotFoundException(key));

        if (req.name() != null) project.setName(req.name());
        if (req.description() != null) project.setDescription(req.description());
        return toResponse(projectRepository.save(project));
    }

    public void delete(String slug, String key, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        Project project = projectRepository.findByWorkspaceAndKey(workspace, key)
                .orElseThrow(() -> new ProjectNotFoundException(key));
        projectRepository.delete(project);
    }

    private ProjectResponse toResponse(Project p) {
        return new ProjectResponse(
                p.getId(),
                p.getWorkspace().getId(),
                p.getWorkspace().getSlug(),
                p.getName(),
                p.getKey(),
                p.getDescription(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
