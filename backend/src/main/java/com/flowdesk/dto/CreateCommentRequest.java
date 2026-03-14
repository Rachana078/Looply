package com.flowdesk.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateCommentRequest(@NotBlank String body, List<String> mentions) {}
