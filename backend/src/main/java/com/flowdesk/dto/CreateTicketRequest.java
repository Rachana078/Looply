package com.flowdesk.dto;

import com.flowdesk.domain.TicketPriority;
import com.flowdesk.domain.TicketStatus;
import com.flowdesk.domain.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTicketRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull TicketType type,
        TicketStatus status,
        @NotNull TicketPriority priority,
        UUID assigneeId,
        Integer storyPoints,
        UUID teamId
) {}
