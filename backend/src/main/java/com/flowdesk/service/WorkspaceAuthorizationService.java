package com.flowdesk.service;

import com.flowdesk.domain.Workspace;
import com.flowdesk.domain.WorkspaceMemberRole;
import com.flowdesk.exception.WorkspaceAccessDeniedException;
import com.flowdesk.repository.WorkspaceMemberRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class WorkspaceAuthorizationService {

    private final WorkspaceMemberRepository memberRepository;

    public WorkspaceAuthorizationService(WorkspaceMemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public WorkspaceMemberRole getRole(UUID workspaceId, UUID userId) {
        return memberRepository.findByIdWorkspaceIdAndIdUserId(workspaceId, userId)
                .map(m -> m.getRole())
                .orElseThrow(() -> new WorkspaceAccessDeniedException("You are not a member of this workspace"));
    }

    public void requireMember(Workspace workspace, UUID userId) {
        getRole(workspace.getId(), userId); // throws if not a member
    }

    public void requireAdminOrOwner(Workspace workspace, UUID userId) {
        WorkspaceMemberRole role = getRole(workspace.getId(), userId);
        if (role == WorkspaceMemberRole.MEMBER) {
            throw new WorkspaceAccessDeniedException("This action requires ADMIN or OWNER role");
        }
    }

    public boolean isAdminOrOwner(Workspace workspace, UUID userId) {
        try {
            WorkspaceMemberRole role = getRole(workspace.getId(), userId);
            return role == WorkspaceMemberRole.ADMIN || role == WorkspaceMemberRole.OWNER;
        } catch (WorkspaceAccessDeniedException e) {
            return false;
        }
    }

    public void requireOwner(Workspace workspace, UUID userId) {
        WorkspaceMemberRole role = getRole(workspace.getId(), userId);
        if (role != WorkspaceMemberRole.OWNER) {
            throw new WorkspaceAccessDeniedException("This action requires OWNER role");
        }
    }
}
