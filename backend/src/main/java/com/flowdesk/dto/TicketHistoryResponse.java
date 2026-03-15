package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TicketHistoryResponse(
        UUID id,
        String field,
        String oldValue,
        String newValue,
        UUID changedById,
        String changedByUsername,
        OffsetDateTime changedAt
) {}
