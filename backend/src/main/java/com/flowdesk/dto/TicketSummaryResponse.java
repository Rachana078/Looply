package com.flowdesk.dto;

import com.flowdesk.domain.TicketPriority;
import com.flowdesk.domain.TicketStatus;
import com.flowdesk.domain.TicketType;

import java.util.UUID;

public record TicketSummaryResponse(
        UUID id,
        String title,
        TicketType type,
        TicketStatus status,
        TicketPriority priority,
        UUID assigneeId,
        String assigneeUsername,
        String assigneeAvatarUrl,
        Integer storyPoints,
        int position,
        UUID teamId,
        String teamName,
        String teamColor,
        String projectKey
) {}
