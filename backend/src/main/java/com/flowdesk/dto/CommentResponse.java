package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String body,
        UUID authorId,
        String authorUsername,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
