package com.flowdesk.dto;

public record AuthResponse(
        String accessToken,
        UserProfileResponse user
) {}
