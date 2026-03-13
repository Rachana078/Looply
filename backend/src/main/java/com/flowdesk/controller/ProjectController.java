package com.flowdesk.controller;

import com.flowdesk.dto.CreateProjectRequest;
import com.flowdesk.dto.ProjectResponse;
import com.flowdesk.dto.UpdateProjectRequest;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects")
@Tag(name = "Projects")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, UserRepository userRepository) {
        this.projectService = projectService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Operation(summary = "Create a project")
    public ResponseEntity<ProjectResponse> create(@PathVariable String slug,
                                                   @Valid @RequestBody CreateProjectRequest req,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(slug, req, callerId(principal)));
    }

    @GetMapping
    @Operation(summary = "List projects in workspace")
    public ResponseEntity<List<ProjectResponse>> list(@PathVariable String slug,
                                                       @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(projectService.getAll(slug, callerId(principal)));
    }

    @GetMapping("/{key}")
    @Operation(summary = "Get project by key")
    public ResponseEntity<ProjectResponse> get(@PathVariable String slug,
                                                @PathVariable String key,
                                                @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(projectService.getByKey(slug, key, callerId(principal)));
    }

    @PatchMapping("/{key}")
    @Operation(summary = "Update project")
    public ResponseEntity<ProjectResponse> update(@PathVariable String slug,
                                                   @PathVariable String key,
                                                   @Valid @RequestBody UpdateProjectRequest req,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(projectService.update(slug, key, req, callerId(principal)));
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete project")
    public ResponseEntity<Void> delete(@PathVariable String slug,
                                        @PathVariable String key,
                                        @AuthenticationPrincipal UserDetails principal) {
        projectService.delete(slug, key, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID callerId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(InvalidCredentialsException::new)
                .getId();
    }
}
