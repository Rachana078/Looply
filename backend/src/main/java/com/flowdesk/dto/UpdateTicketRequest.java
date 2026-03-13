package com.flowdesk.dto;

import com.flowdesk.domain.TicketPriority;
import com.flowdesk.domain.TicketType;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateTicketRequest(
        @Size(max = 255) String title,
        String description,
        TicketType type,
        TicketPriority priority,
        UUID assigneeId,
        Integer storyPoints,
        String teamId   // null = no change, "" = clear team, UUID string = assign team
) {}
