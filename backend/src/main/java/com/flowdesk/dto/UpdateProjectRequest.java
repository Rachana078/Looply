package com.flowdesk.dto;

import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @Size(min = 2, max = 100) String name,
        String description
) {}
