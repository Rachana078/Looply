package com.flowdesk.dto;

import com.flowdesk.domain.TicketPriority;
import com.flowdesk.domain.TicketStatus;
import com.flowdesk.domain.TicketType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID projectId,
        String projectKey,
        UUID workspaceId,
        String workspaceSlug,
        String title,
        String description,
        TicketType type,
        TicketStatus status,
        TicketPriority priority,
        UUID assigneeId,
        String assigneeUsername,
        String assigneeAvatarUrl,
        UUID reporterId,
        String reporterUsername,
        Integer storyPoints,
        int position,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        UUID teamId,
        String teamName,
        String teamColor
) {}
