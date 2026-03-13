package com.flowdesk.dto;

import com.flowdesk.domain.WorkspaceMemberRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull WorkspaceMemberRole role
) {}
