package com.flowdesk.exception;

public class SlugAlreadyExistsException extends RuntimeException {
    public SlugAlreadyExistsException(String slug) {
        super("Slug already in use: " + slug);
    }
}
