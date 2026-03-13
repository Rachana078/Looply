package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record WorkspaceResponse(
        UUID id,
        String name,
        String slug,
        UUID ownerId,
        List<WorkspaceMemberResponse> members,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
