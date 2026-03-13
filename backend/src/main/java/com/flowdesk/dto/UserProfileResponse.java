package com.flowdesk.dto;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl
) {}
