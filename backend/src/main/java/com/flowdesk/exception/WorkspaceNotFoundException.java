package com.flowdesk.exception;

public class WorkspaceNotFoundException extends RuntimeException {
    public WorkspaceNotFoundException(String slug) {
        super("Workspace not found: " + slug);
    }
}
