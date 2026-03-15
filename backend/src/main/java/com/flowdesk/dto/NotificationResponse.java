package com.flowdesk.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String body,
        String link,
        boolean read,
        String actorUsername,
        Instant createdAt
) {}
