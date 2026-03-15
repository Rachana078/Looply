package com.flowdesk.controller;

import com.flowdesk.domain.TicketStatus;
import com.flowdesk.domain.TicketType;
import com.flowdesk.dto.*;
import com.flowdesk.dto.TicketHistoryResponse;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.service.TicketService;
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
@RequestMapping("/api/v1/workspaces/{slug}/projects/{key}/tickets")
@Tag(name = "Tickets")
@SecurityRequirement(name = "bearerAuth")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Operation(summary = "Create a ticket")
    public ResponseEntity<TicketResponse> create(
            @PathVariable String slug, @PathVariable String key,
            @Valid @RequestBody CreateTicketRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.create(slug, key, req, callerId(principal)));
    }

    @GetMapping
    @Operation(summary = "Get backlog (filterable)")
    public ResponseEntity<List<TicketSummaryResponse>> getBacklog(
            @PathVariable String slug, @PathVariable String key,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketType type,
            @RequestParam(required = false) UUID assigneeId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ticketService.getBacklog(slug, key, status, type, assigneeId, callerId(principal)));
    }

    @GetMapping("/{ticketId}")
    @Operation(summary = "Get ticket by ID")
    public ResponseEntity<TicketResponse> getById(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ticketService.getById(slug, key, ticketId, callerId(principal)));
    }

    @PatchMapping("/{ticketId}")
    @Operation(summary = "Update ticket")
    public ResponseEntity<TicketResponse> update(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ticketService.update(slug, key, ticketId, req, callerId(principal)));
    }

    @DeleteMapping("/{ticketId}")
    @Operation(summary = "Delete ticket (ADMIN/OWNER only)")
    public ResponseEntity<Void> delete(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails principal) {
        ticketService.delete(slug, key, ticketId, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{ticketId}/status")
    @Operation(summary = "Update ticket status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ticketService.updateStatus(slug, key, ticketId, req, callerId(principal)));
    }

    @GetMapping("/{ticketId}/history")
    @Operation(summary = "Get ticket change history")
    public ResponseEntity<List<TicketHistoryResponse>> getHistory(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ticketService.getHistory(slug, key, ticketId, callerId(principal)));
    }

    @PatchMapping("/reorder")
    @Operation(summary = "Reorder tickets")
    public ResponseEntity<Void> reorder(
            @PathVariable String slug, @PathVariable String key,
            @Valid @RequestBody ReorderTicketsRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        ticketService.reorder(slug, key, req, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID callerId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(InvalidCredentialsException::new)
                .getId();
    }
}
