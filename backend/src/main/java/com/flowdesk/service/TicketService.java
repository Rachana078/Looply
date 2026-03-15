package com.flowdesk.service;

import com.flowdesk.domain.*;
import com.flowdesk.dto.*;
import com.flowdesk.dto.TicketEvent;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.exception.TicketNotFoundException;
import com.flowdesk.exception.WorkspaceAccessDeniedException;
import com.flowdesk.repository.ProjectRepository;
import com.flowdesk.repository.ProjectTeamRepository;
import com.flowdesk.repository.TicketHistoryRepository;
import com.flowdesk.repository.TicketRepository;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.exception.ProjectNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectTeamRepository teamRepository;
    private final WorkspaceService workspaceService;
    private final WorkspaceAuthorizationService authz;
    private final SimpMessagingTemplate messaging;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final TicketHistoryRepository historyRepository;

    public TicketService(TicketRepository ticketRepository,
                         ProjectRepository projectRepository,
                         UserRepository userRepository,
                         ProjectTeamRepository teamRepository,
                         WorkspaceService workspaceService,
                         WorkspaceAuthorizationService authz,
                         SimpMessagingTemplate messaging,
                         NotificationService notificationService,
                         EmailService emailService,
                         TicketHistoryRepository historyRepository) {
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.workspaceService = workspaceService;
        this.authz = authz;
        this.messaging = messaging;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.historyRepository = historyRepository;
    }

    public TicketResponse create(String slug, String projectKey,
                                  CreateTicketRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);

        User reporter = userRepository.findById(callerId)
                .orElseThrow(InvalidCredentialsException::new);

        User assignee = null;
        if (req.assigneeId() != null) {
            assignee = userRepository.findById(req.assigneeId())
                    .orElseThrow(() -> new InvalidCredentialsException());
            authz.requireMember(workspace, assignee.getId());
        }

        int nextPosition = ticketRepository.findMaxPositionByProject(project) + 1;

        Ticket ticket = new Ticket();
        ticket.setProject(project);
        ticket.setWorkspace(workspace);
        ticket.setTitle(req.title());
        ticket.setDescription(req.description());
        ticket.setType(req.type());
        ticket.setStatus(req.status() != null ? req.status() : TicketStatus.BACKLOG);
        ticket.setPriority(req.priority());
        ticket.setReporter(reporter);
        ticket.setAssignee(assignee);
        ticket.setStoryPoints(req.storyPoints());
        ticket.setPosition(nextPosition);

        if (req.teamId() != null) {
            ProjectTeam team = teamRepository.findById(req.teamId())
                    .orElseThrow(() -> new WorkspaceAccessDeniedException("Team not found"));
            ticket.setTeam(team);
        }

        Ticket saved = ticketRepository.save(ticket);
        messaging.convertAndSend(
            "/topic/workspaces/" + slug + "/projects/" + projectKey + "/tickets",
            new TicketEvent("CREATED", toSummaryResponse(saved))
        );
        if (assignee != null) {
            String link = "/workspaces/" + slug + "/projects/" + projectKey + "/tickets/" + saved.getId();
            notificationService.notify(assignee, reporter, "ASSIGNED",
                    reporter.getUsername() + " assigned you a ticket",
                    saved.getTitle(), link);
            emailService.sendTicketAssignedEmail(
                    assignee.getEmail(), reporter.getUsername(), saved.getTitle(), link);
        }
        return toFullResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketSummaryResponse> getBacklog(String slug, String projectKey,
                                                    TicketStatus statusFilter,
                                                    TicketType typeFilter,
                                                    UUID assigneeIdFilter,
                                                    UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        return ticketRepository.findBacklog(project, statusFilter, typeFilter, assigneeIdFilter)
                .stream().map(this::toSummaryResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketSummaryResponse> search(String slug, String q, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        if (q == null || q.isBlank()) return List.of();
        return ticketRepository.searchByWorkspace(workspace, q.trim())
                .stream().map(this::toSummaryResponse).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getById(String slug, String projectKey,
                                   UUID ticketId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        return toFullResponse(ticket);
    }

    public TicketResponse update(String slug, String projectKey,
                                  UUID ticketId, UpdateTicketRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        User actor = userRepository.findById(callerId).orElseThrow(InvalidCredentialsException::new);

        if (req.title() != null && !req.title().equals(ticket.getTitle())) {
            recordChange(ticket, actor, "title", ticket.getTitle(), req.title());
            ticket.setTitle(req.title());
        }
        if (req.description() != null) ticket.setDescription(req.description());
        if (req.type() != null && !req.type().equals(ticket.getType())) {
            recordChange(ticket, actor, "type", ticket.getType().name(), req.type().name());
            ticket.setType(req.type());
        }
        if (req.priority() != null && !req.priority().equals(ticket.getPriority())) {
            recordChange(ticket, actor, "priority", ticket.getPriority().name(), req.priority().name());
            ticket.setPriority(req.priority());
        }
        if (req.storyPoints() != null) {
            String oldSp = ticket.getStoryPoints() != null ? ticket.getStoryPoints().toString() : null;
            String newSp = req.storyPoints() > 0 ? req.storyPoints().toString() : null;
            if (!java.util.Objects.equals(oldSp, newSp)) {
                recordChange(ticket, actor, "storyPoints", oldSp, newSp);
            }
            ticket.setStoryPoints(req.storyPoints() > 0 ? req.storyPoints() : null);
        }
        if (req.assigneeId() != null) {
            User newAssignee = req.assigneeId().toString().isBlank() ? null :
                    userRepository.findById(req.assigneeId()).orElseThrow(InvalidCredentialsException::new);
            User previousAssignee = ticket.getAssignee();
            String oldName = previousAssignee != null ? previousAssignee.getUsername() : null;
            String newName = newAssignee != null ? newAssignee.getUsername() : null;
            if (!java.util.Objects.equals(oldName, newName)) {
                recordChange(ticket, actor, "assignee", oldName, newName);
            }
            ticket.setAssignee(newAssignee);
            if (newAssignee != null && (previousAssignee == null || !previousAssignee.getId().equals(newAssignee.getId()))) {
                String link = "/workspaces/" + slug + "/projects/" + projectKey + "/tickets/" + ticket.getId();
                notificationService.notify(newAssignee, actor, "ASSIGNED",
                        actor.getUsername() + " assigned you a ticket",
                        ticket.getTitle(), link);
                emailService.sendTicketAssignedEmail(
                        newAssignee.getEmail(), actor.getUsername(), ticket.getTitle(), link);
            }
        }

        if (req.teamId() != null) {
            if (req.teamId().isBlank()) {
                ticket.setTeam(null);
            } else {
                ProjectTeam team = teamRepository.findById(UUID.fromString(req.teamId()))
                        .orElseThrow(() -> new WorkspaceAccessDeniedException("Team not found"));
                ticket.setTeam(team);
            }
        }

        Ticket saved = ticketRepository.save(ticket);
        messaging.convertAndSend(
            "/topic/workspaces/" + slug + "/projects/" + projectKey + "/tickets",
            new TicketEvent("UPDATED", toSummaryResponse(saved))
        );
        return toFullResponse(saved);
    }

    public void delete(String slug, String projectKey, UUID ticketId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        String workspaceSlug = workspace.getSlug();
        String projectKeyStr = project.getKey();
        ticketRepository.delete(ticket);
        messaging.convertAndSend(
            "/topic/workspaces/" + workspaceSlug + "/projects/" + projectKeyStr + "/tickets",
            new TicketEvent("DELETED", ticketId.toString())
        );
    }

    public TicketResponse updateStatus(String slug, String projectKey,
                                        UUID ticketId, UpdateTicketStatusRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        User actor = userRepository.findById(callerId).orElseThrow(InvalidCredentialsException::new);
        if (!req.status().equals(ticket.getStatus())) {
            recordChange(ticket, actor, "status", ticket.getStatus().name(), req.status().name());
        }
        ticket.setStatus(req.status());
        Ticket saved = ticketRepository.save(ticket);
        messaging.convertAndSend(
            "/topic/workspaces/" + slug + "/projects/" + projectKey + "/tickets",
            new TicketEvent("UPDATED", toSummaryResponse(saved))
        );
        return toFullResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketHistoryResponse> getHistory(String slug, String projectKey,
                                                   UUID ticketId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        return historyRepository.findByTicketOrderByChangedAtDesc(ticket)
                .stream().map(h -> new TicketHistoryResponse(
                        h.getId(), h.getField(), h.getOldValue(), h.getNewValue(),
                        h.getChangedBy().getId(), h.getChangedBy().getUsername(),
                        h.getChangedAt()
                )).toList();
    }

    public void reorder(String slug, String projectKey,
                         ReorderTicketsRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);

        List<Ticket> existing = ticketRepository.findByProject(project);
        Map<UUID, Ticket> ticketMap = existing.stream()
                .collect(Collectors.toMap(Ticket::getId, t -> t));

        List<Ticket> toSave = req.entries().stream()
                .filter(e -> ticketMap.containsKey(e.id()))
                .map(e -> {
                    Ticket t = ticketMap.get(e.id());
                    t.setPosition(e.position());
                    return t;
                })
                .toList();

        ticketRepository.saveAll(toSave);
    }

    // --- helpers ---

    private void recordChange(Ticket ticket, User actor, String field, String oldValue, String newValue) {
        TicketHistory entry = new TicketHistory();
        entry.setTicket(ticket);
        entry.setChangedBy(actor);
        entry.setField(field);
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        historyRepository.save(entry);
    }

    private Project findProject(Workspace workspace, String key) {
        return projectRepository.findByWorkspaceAndKey(workspace, key)
                .orElseThrow(() -> new ProjectNotFoundException(key));
    }

    private Ticket loadTicket(UUID ticketId, Project project) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
        if (!ticket.getProject().getId().equals(project.getId())) {
            throw new TicketNotFoundException(ticketId);
        }
        return ticket;
    }

    private TicketResponse toFullResponse(Ticket t) {
        User assignee = t.getAssignee();
        User reporter = t.getReporter();
        ProjectTeam team = t.getTeam();
        return new TicketResponse(
                t.getId(),
                t.getProject().getId(), t.getProject().getKey(),
                t.getWorkspace().getId(), t.getWorkspace().getSlug(),
                t.getTitle(), t.getDescription(),
                t.getType(), t.getStatus(), t.getPriority(),
                assignee != null ? assignee.getId() : null,
                assignee != null ? assignee.getUsername() : null,
                assignee != null ? assignee.getAvatarUrl() : null,
                reporter.getId(), reporter.getUsername(),
                t.getStoryPoints(), t.getPosition(),
                t.getCreatedAt(), t.getUpdatedAt(),
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                team != null ? team.getColor() : null
        );
    }

    private TicketSummaryResponse toSummaryResponse(Ticket t) {
        User assignee = t.getAssignee();
        ProjectTeam team = t.getTeam();
        return new TicketSummaryResponse(
                t.getId(), t.getTitle(), t.getType(), t.getStatus(), t.getPriority(),
                assignee != null ? assignee.getId() : null,
                assignee != null ? assignee.getUsername() : null,
                assignee != null ? assignee.getAvatarUrl() : null,
                t.getStoryPoints(), t.getPosition(),
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                team != null ? team.getColor() : null,
                t.getProject().getKey()
        );
    }
}
