package com.flowdesk.controller;

import com.flowdesk.dto.CreateTeamRequest;
import com.flowdesk.dto.TeamResponse;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.service.TeamService;
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
@RequestMapping("/api/v1/workspaces/{slug}/projects/{key}/teams")
@Tag(name = "Teams")
@SecurityRequirement(name = "bearerAuth")
public class TeamController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    public TeamController(TeamService teamService, UserRepository userRepository) {
        this.teamService = teamService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List teams in a project")
    public ResponseEntity<List<TeamResponse>> list(
            @PathVariable String slug, @PathVariable String key,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(teamService.list(slug, key, callerId(principal)));
    }

    @PostMapping
    @Operation(summary = "Create a team (ADMIN/OWNER only)")
    public ResponseEntity<TeamResponse> create(
            @PathVariable String slug, @PathVariable String key,
            @Valid @RequestBody CreateTeamRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teamService.create(slug, key, req, callerId(principal)));
    }

    @DeleteMapping("/{teamId}")
    @Operation(summary = "Delete a team (ADMIN/OWNER only)")
    public ResponseEntity<Void> delete(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID teamId,
            @AuthenticationPrincipal UserDetails principal) {
        teamService.delete(slug, key, teamId, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID callerId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(InvalidCredentialsException::new)
                .getId();
    }
}
