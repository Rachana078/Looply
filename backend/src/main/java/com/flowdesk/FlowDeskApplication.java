package com.flowdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FlowDeskApplication {
    public static void main(String[] args) {
        SpringApplication.run(FlowDeskApplication.class, args);
    }
}
