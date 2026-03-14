package com.flowdesk.service;

import com.flowdesk.domain.*;
import com.flowdesk.dto.CommentEvent;
import com.flowdesk.dto.CommentResponse;
import com.flowdesk.dto.CreateCommentRequest;
import com.flowdesk.exception.*;
import com.flowdesk.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final WorkspaceService workspaceService;
    private final WorkspaceAuthorizationService authz;
    private final SimpMessagingTemplate messaging;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public CommentService(CommentRepository commentRepository,
                          TicketRepository ticketRepository,
                          ProjectRepository projectRepository,
                          UserRepository userRepository,
                          WorkspaceService workspaceService,
                          WorkspaceAuthorizationService authz,
                          SimpMessagingTemplate messaging,
                          NotificationService notificationService,
                          EmailService emailService) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.workspaceService = workspaceService;
        this.authz = authz;
        this.messaging = messaging;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> list(String slug, String projectKey, UUID ticketId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        loadTicket(workspace, projectKey, ticketId);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream().map(this::toResponse).toList();
    }

    public CommentResponse add(String slug, String projectKey, UUID ticketId,
                                CreateCommentRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Ticket ticket = loadTicket(workspace, projectKey, ticketId);
        User author = userRepository.findById(callerId)
                .orElseThrow(InvalidCredentialsException::new);

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setBody(req.body());
        CommentResponse response = toResponse(commentRepository.save(comment));
        messaging.convertAndSend(
            "/topic/workspaces/" + slug + "/projects/" + projectKey + "/tickets/" + ticketId + "/comments",
            new CommentEvent("CREATED", response)
        );
        // Notify assignee and reporter (if they're not the commenter)
        String link = "/workspaces/" + slug + "/projects/" + projectKey + "/tickets/" + ticketId;
        String notifTitle = author.getUsername() + " commented on: " + ticket.getTitle();
        if (ticket.getAssignee() != null) {
            notificationService.notify(ticket.getAssignee(), author, "COMMENT", notifTitle, req.body(), link);
        }
        if (!ticket.getReporter().getId().equals(author.getId()) &&
            (ticket.getAssignee() == null || !ticket.getReporter().getId().equals(ticket.getAssignee().getId()))) {
            notificationService.notify(ticket.getReporter(), author, "COMMENT", notifTitle, req.body(), link);
        }

        // Notify @mentioned users
        if (req.mentions() != null) {
            String mentionTitle = author.getUsername() + " mentioned you in: " + ticket.getTitle();
            for (String username : req.mentions()) {
                userRepository.findByUsername(username).ifPresent(mentioned -> {
                    notificationService.notify(mentioned, author, "MENTION", mentionTitle, req.body(), link);
                    emailService.sendMentionNotification(
                            mentioned.getEmail(), author.getUsername(), ticket.getTitle(), link);
                });
            }
        }

        return response;
    }

    public void delete(String slug, String projectKey, UUID ticketId,
                       UUID commentId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        loadTicket(workspace, projectKey, ticketId);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new WorkspaceNotFoundException("Comment not found"));

        boolean isAuthor = comment.getAuthor().getId().equals(callerId);
        boolean isAdminOrOwner = authz.isAdminOrOwner(workspace, callerId);
        if (!isAuthor && !isAdminOrOwner) {
            throw new WorkspaceAccessDeniedException("Only the author, ADMIN or OWNER can delete a comment");
        }
        commentRepository.delete(comment);
        messaging.convertAndSend(
            "/topic/workspaces/" + slug + "/projects/" + projectKey + "/tickets/" + ticketId + "/comments",
            new CommentEvent("DELETED", commentId.toString())
        );
    }

    private Ticket loadTicket(Workspace workspace, String projectKey, UUID ticketId) {
        Project project = projectRepository.findByWorkspaceAndKey(workspace, projectKey)
                .orElseThrow(() -> new ProjectNotFoundException(projectKey));
        return ticketRepository.findById(ticketId)
                .filter(t -> t.getProject().getId().equals(project.getId()))
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
    }

    private CommentResponse toResponse(Comment c) {
        return new CommentResponse(
                c.getId(), c.getBody(),
                c.getAuthor().getId(), c.getAuthor().getUsername(),
                c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
