package com.flowdesk.service;

import com.flowdesk.domain.*;
import com.flowdesk.dto.*;
import com.flowdesk.exception.*;
import com.flowdesk.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final WorkspaceAuthorizationService authz;

    public WorkspaceService(WorkspaceRepository workspaceRepository,
                            WorkspaceMemberRepository memberRepository,
                            UserRepository userRepository,
                            WorkspaceAuthorizationService authz) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.authz = authz;
    }

    public WorkspaceResponse create(CreateWorkspaceRequest req, UUID callerId) {
        if (workspaceRepository.existsBySlug(req.slug())) {
            throw new SlugAlreadyExistsException(req.slug());
        }
        User owner = userRepository.findById(callerId)
                .orElseThrow(() -> new InvalidCredentialsException());

        Workspace workspace = new Workspace();
        workspace.setName(req.name());
        workspace.setSlug(req.slug());
        workspace.setOwner(owner);
        workspace = workspaceRepository.save(workspace);

        WorkspaceMember member = new WorkspaceMember();
        member.setId(new WorkspaceMemberId(workspace.getId(), callerId));
        member.setWorkspace(workspace);
        member.setUser(owner);
        member.setRole(WorkspaceMemberRole.OWNER);
        memberRepository.save(member);

        return toResponse(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceSummaryResponse> getMyWorkspaces(UUID callerId) {
        return workspaceRepository.findAllByMemberUserId(callerId).stream()
                .map(w -> {
                    String role = memberRepository
                            .findByIdWorkspaceIdAndIdUserId(w.getId(), callerId)
                            .map(m -> m.getRole().name())
                            .orElse("MEMBER");
                    return new WorkspaceSummaryResponse(
                            w.getId(), w.getName(), w.getSlug(),
                            w.getOwner().getId(), role, w.getCreatedAt());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getBySlug(String slug, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireMember(workspace, callerId);
        return toResponse(workspace);
    }

    public WorkspaceResponse update(String slug, UpdateWorkspaceRequest req, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);
        workspace.setName(req.name());
        return toResponse(workspaceRepository.save(workspace));
    }

    public void delete(String slug, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireOwner(workspace, callerId);
        workspaceRepository.delete(workspace);
    }

    public WorkspaceMemberResponse addMember(String slug, AddMemberRequest req, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireAdminOrOwner(workspace, callerId);

        if (req.role() == WorkspaceMemberRole.OWNER) {
            throw new WorkspaceAccessDeniedException("Cannot assign OWNER role via this endpoint");
        }

        User newUser = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new InvalidCredentialsException());

        if (memberRepository.findByIdWorkspaceIdAndIdUserId(workspace.getId(), newUser.getId()).isPresent()) {
            throw new SlugAlreadyExistsException("User is already a member of this workspace");
        }

        WorkspaceMember member = new WorkspaceMember();
        member.setId(new WorkspaceMemberId(workspace.getId(), newUser.getId()));
        member.setWorkspace(workspace);
        member.setUser(newUser);
        member.setRole(req.role());
        member = memberRepository.save(member);

        return toMemberResponse(member);
    }

    public WorkspaceMemberResponse updateMemberRole(String slug, UUID userId,
                                                     UpdateMemberRoleRequest req, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireOwner(workspace, callerId);

        WorkspaceMember member = memberRepository.findByIdWorkspaceIdAndIdUserId(workspace.getId(), userId)
                .orElseThrow(() -> new WorkspaceNotFoundException("Member not found"));

        if (member.getRole() == WorkspaceMemberRole.OWNER) {
            throw new WorkspaceAccessDeniedException("Cannot change role of workspace OWNER");
        }

        member.setRole(req.role());
        return toMemberResponse(memberRepository.save(member));
    }

    public void removeMember(String slug, UUID userId, UUID callerId) {
        Workspace workspace = findBySlug(slug);

        boolean isSelf = callerId.equals(userId);
        if (!isSelf) {
            authz.requireAdminOrOwner(workspace, callerId);
        }

        WorkspaceMember member = memberRepository.findByIdWorkspaceIdAndIdUserId(workspace.getId(), userId)
                .orElseThrow(() -> new WorkspaceNotFoundException("Member not found"));

        if (member.getRole() == WorkspaceMemberRole.OWNER) {
            throw new WorkspaceAccessDeniedException("Cannot remove workspace OWNER");
        }

        memberRepository.delete(member);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getMembers(String slug, UUID callerId) {
        Workspace workspace = findBySlug(slug);
        authz.requireMember(workspace, callerId);
        return memberRepository.findByIdWorkspaceId(workspace.getId()).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    // --- helpers ---

    public Workspace findBySlug(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new WorkspaceNotFoundException(slug));
    }

    private WorkspaceResponse toResponse(Workspace w) {
        List<WorkspaceMemberResponse> members = memberRepository
                .findByIdWorkspaceId(w.getId()).stream()
                .map(this::toMemberResponse)
                .toList();
        return new WorkspaceResponse(
                w.getId(), w.getName(), w.getSlug(),
                w.getOwner().getId(), members, w.getCreatedAt(), w.getUpdatedAt());
    }

    private WorkspaceMemberResponse toMemberResponse(WorkspaceMember m) {
        User u = m.getUser();
        return new WorkspaceMemberResponse(
                u.getId(), u.getUsername(), u.getEmail(),
                u.getAvatarUrl(), m.getRole().name(), m.getJoinedAt());
    }
}
