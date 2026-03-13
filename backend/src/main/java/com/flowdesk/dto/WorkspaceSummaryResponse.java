package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkspaceSummaryResponse(
        UUID id,
        String name,
        String slug,
        UUID ownerId,
        String callerRole,
        OffsetDateTime createdAt
) {}
