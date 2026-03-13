package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID workspaceId,
        String workspaceSlug,
        String name,
        String key,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
