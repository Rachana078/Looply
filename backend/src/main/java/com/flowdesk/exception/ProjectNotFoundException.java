package com.flowdesk.exception;

public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException(String key) {
        super("Project not found: " + key);
    }
}
