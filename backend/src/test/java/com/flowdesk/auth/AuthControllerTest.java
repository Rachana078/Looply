package com.flowdesk.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowdesk.dto.LoginRequest;
import com.flowdesk.dto.RegisterRequest;
import com.flowdesk.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    @BeforeEach
    void cleanup() {
        userRepository.deleteAll();
    }

    @Test
    void register_shouldReturn201AndCreateUser() throws Exception {
        var req = new RegisterRequest("test@example.com", "testuser", "password123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.username").value("testuser"));

        assertThat(userRepository.existsByEmail("test@example.com")).isTrue();
    }

    @Test
    void login_shouldReturn200WithTokenAndCookie() throws Exception {
        // first register
        var reg = new RegisterRequest("login@example.com", "loginuser", "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        // then login
        var login = new LoginRequest("login@example.com", "password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(cookie().exists("refreshToken"));
    }

    @Test
    void refresh_shouldReturn200WithNewAccessToken() throws Exception {
        var reg = new RegisterRequest("refresh@example.com", "refreshuser", "password123");
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        // grab the refresh cookie
        var cookies = regResult.getResponse().getCookies();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(cookies))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void logout_shouldClearCookieAndRevokeToken() throws Exception {
        var reg = new RegisterRequest("logout@example.com", "logoutuser", "password123");
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        String accessToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("accessToken").asText();
        var cookies = regResult.getResponse().getCookies();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .cookie(cookies))
                .andExpect(status().isNoContent());

        // refresh should now fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(cookies))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void register_duplicateEmail_shouldReturn409() throws Exception {
        var req = new RegisterRequest("dup@example.com", "dupuser", "password123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        var req2 = new RegisterRequest("dup@example.com", "dupuser2", "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict());
    }
}
