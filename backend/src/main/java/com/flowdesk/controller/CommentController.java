package com.flowdesk.controller;

import com.flowdesk.dto.CommentResponse;
import com.flowdesk.dto.CreateCommentRequest;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.service.CommentService;
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
@RequestMapping("/api/v1/workspaces/{slug}/projects/{key}/tickets/{ticketId}/comments")
@Tag(name = "Comments")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    public CommentController(CommentService commentService, UserRepository userRepository) {
        this.commentService = commentService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List comments on a ticket")
    public ResponseEntity<List<CommentResponse>> list(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(commentService.list(slug, key, ticketId, callerId(principal)));
    }

    @PostMapping
    @Operation(summary = "Add a comment")
    public ResponseEntity<CommentResponse> add(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.add(slug, key, ticketId, req, callerId(principal)));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete a comment (author, ADMIN or OWNER)")
    public ResponseEntity<Void> delete(
            @PathVariable String slug, @PathVariable String key,
            @PathVariable UUID ticketId, @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails principal) {
        commentService.delete(slug, key, ticketId, commentId, callerId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID callerId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(InvalidCredentialsException::new)
                .getId();
    }
}
