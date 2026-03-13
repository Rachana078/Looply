package com.flowdesk.service;

import com.flowdesk.domain.*;
import com.flowdesk.dto.*;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.exception.TicketNotFoundException;
import com.flowdesk.exception.WorkspaceAccessDeniedException;
import com.flowdesk.repository.ProjectRepository;
import com.flowdesk.repository.ProjectTeamRepository;
import com.flowdesk.repository.TicketRepository;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.exception.ProjectNotFoundException;
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

    public TicketService(TicketRepository ticketRepository,
                         ProjectRepository projectRepository,
                         UserRepository userRepository,
                         ProjectTeamRepository teamRepository,
                         WorkspaceService workspaceService,
                         WorkspaceAuthorizationService authz) {
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.workspaceService = workspaceService;
        this.authz = authz;
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

        return toFullResponse(ticketRepository.save(ticket));
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

        if (req.title() != null) ticket.setTitle(req.title());
        if (req.description() != null) ticket.setDescription(req.description());
        if (req.type() != null) ticket.setType(req.type());
        if (req.priority() != null) ticket.setPriority(req.priority());
        if (req.storyPoints() != null) ticket.setStoryPoints(req.storyPoints());
        if (req.assigneeId() != null) {
            User assignee = userRepository.findById(req.assigneeId())
                    .orElseThrow(InvalidCredentialsException::new);
            ticket.setAssignee(assignee);
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

        return toFullResponse(ticketRepository.save(ticket));
    }

    public void delete(String slug, String projectKey, UUID ticketId, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        ticketRepository.delete(ticket);
    }

    public TicketResponse updateStatus(String slug, String projectKey,
                                        UUID ticketId, UpdateTicketStatusRequest req, UUID callerId) {
        Workspace workspace = workspaceService.findBySlug(slug);
        authz.requireMember(workspace, callerId);
        Project project = findProject(workspace, projectKey);
        Ticket ticket = loadTicket(ticketId, project);
        ticket.setStatus(req.status());
        return toFullResponse(ticketRepository.save(ticket));
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
                team != null ? team.getColor() : null
        );
    }
}
