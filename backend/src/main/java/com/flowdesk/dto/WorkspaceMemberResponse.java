package com.flowdesk.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkspaceMemberResponse(
        UUID userId,
        String username,
        String email,
        String avatarUrl,
        String role,
        OffsetDateTime joinedAt
) {}
