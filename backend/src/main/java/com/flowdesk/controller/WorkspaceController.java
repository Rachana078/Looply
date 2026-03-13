package com.flowdesk.controller;

import com.flowdesk.dto.*;
import com.flowdesk.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.exception.InvalidCredentialsException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@Tag(name = "Workspaces")
@SecurityRequirement(name = "bearerAuth")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;

    public WorkspaceController(WorkspaceService workspaceService, UserRepository userRepository) {
        this.workspaceService = workspaceService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Operation(summary = "Create a workspace")
    public ResponseEntity<WorkspaceResponse> create(@Valid @RequestBody CreateWorkspaceRequest req,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.create(req, callerId(principal)));
    }

    @GetMapping
    @Operation(summary = "List my workspaces")
    public ResponseEntity<List<WorkspaceSummaryResponse>> list(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces(callerId(principal)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get workspace by slug")
    public ResponseEntity<WorkspaceResponse> get(@PathVariable String slug,
                                                  @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workspaceService.getBySlug(slug, callerId(principal)));
    }

    @PatchMapping("/{slug}")
    @Operation(summary = "Update workspace name")
    public ResponseEntity<WorkspaceResponse> update(@PathVariable String slug,
                                                     @Valid @RequestBody UpdateWorkspaceRequest req,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workspaceService.update(slug, req, callerId(principal)));
    }

    @DeleteMapping("/{slug}")
    @Operation(summary = "Delete workspace (OWNER only)")
    public ResponseEntity<Void> delete(@PathVariable String slug,
                                        @AuthenticationPrincipal UserDetails principal) {
        workspaceService.delete(slug, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{slug}/members")
    @Operation(summary = "List workspace members")
    public ResponseEntity<List<WorkspaceMemberResponse>> getMembers(@PathVariable String slug,
                                                                      @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workspaceService.getMembers(slug, callerId(principal)));
    }

    @PostMapping("/{slug}/members")
    @Operation(summary = "Add a member")
    public ResponseEntity<WorkspaceMemberResponse> addMember(@PathVariable String slug,
                                                              @Valid @RequestBody AddMemberRequest req,
                                                              @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.addMember(slug, req, callerId(principal)));
    }

    @PatchMapping("/{slug}/members/{userId}")
    @Operation(summary = "Update member role (OWNER only)")
    public ResponseEntity<WorkspaceMemberResponse> updateMemberRole(@PathVariable String slug,
                                                                      @PathVariable UUID userId,
                                                                      @Valid @RequestBody UpdateMemberRoleRequest req,
                                                                      @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workspaceService.updateMemberRole(slug, userId, req, callerId(principal)));
    }

    @DeleteMapping("/{slug}/members/{userId}")
    @Operation(summary = "Remove a member")
    public ResponseEntity<Void> removeMember(@PathVariable String slug,
                                              @PathVariable UUID userId,
                                              @AuthenticationPrincipal UserDetails principal) {
        workspaceService.removeMember(slug, userId, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID callerId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(InvalidCredentialsException::new)
                .getId();
    }
}
