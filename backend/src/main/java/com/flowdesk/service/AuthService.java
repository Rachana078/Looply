package com.flowdesk.service;

import com.flowdesk.domain.EmailVerificationToken;
import com.flowdesk.domain.RefreshToken;
import com.flowdesk.domain.User;
import com.flowdesk.dto.AuthResponse;
import com.flowdesk.dto.ChangePasswordRequest;
import com.flowdesk.dto.LoginRequest;
import com.flowdesk.dto.MessageResponse;
import com.flowdesk.dto.RegisterRequest;
import com.flowdesk.dto.UpdateProfileRequest;
import com.flowdesk.dto.UserProfileResponse;
import com.flowdesk.exception.EmailAlreadyExistsException;
import com.flowdesk.exception.EmailNotVerifiedException;
import com.flowdesk.exception.InvalidCredentialsException;
import com.flowdesk.exception.TokenRefreshException;
import com.flowdesk.repository.EmailVerificationTokenRepository;
import com.flowdesk.repository.RefreshTokenRepository;
import com.flowdesk.repository.UserRepository;
import com.flowdesk.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       EmailVerificationTokenRepository verificationTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.emailService = emailService;
    }

    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new EmailAlreadyExistsException("Username already taken: " + request.username());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(false);
        user = userRepository.save(user);

        String token = issueVerificationToken(user);
        String verificationUrl = baseUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationUrl);

        return new MessageResponse("Check your inbox — we've sent a verification link to " + user.getEmail());
    }

    public AuthResponse verifyEmail(String token, HttpServletResponse response) {
        EmailVerificationToken vt = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired verification link"));
        if (vt.isUsed()) {
            throw new InvalidCredentialsException("This verification link has already been used");
        }
        if (vt.getExpiresAt().isBefore(java.time.OffsetDateTime.now())) {
            throw new InvalidCredentialsException("This verification link has expired");
        }
        User user = vt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        vt.setUsed(true);
        verificationTokenRepository.save(vt);

        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        return issueTokens(user, response);
    }

    public MessageResponse resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("No account found with that email address"));
        if (user.isEmailVerified()) {
            return new MessageResponse("Your email is already verified. You can sign in.");
        }
        verificationTokenRepository.deleteByUserId(user.getId());
        String token = issueVerificationToken(user);
        String verificationUrl = baseUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationUrl);
        return new MessageResponse("Verification email resent to " + email);
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("No account found with that email address"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("Incorrect password");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }

        return issueTokens(user, response);
    }

    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request);
        if (rawToken == null) {
            throw new TokenRefreshException("No refresh token cookie found");
        }

        String hash = jwtUtil.generateRefreshTokenHash(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new TokenRefreshException("Invalid refresh token"));

        if (stored.isRevoked()) {
            throw new TokenRefreshException("Refresh token has been revoked");
        }
        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new TokenRefreshException("Refresh token has expired");
        }

        // Rotate: revoke old, issue new
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        return issueTokens(user, response);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request);
        if (rawToken != null) {
            String hash = jwtUtil.generateRefreshTokenHash(rawToken);
            refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        }
        clearRefreshCookie(response);
    }

    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        return toProfile(user);
    }

    public UserProfileResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (req.username() != null && !req.username().isBlank()) {
            if (!req.username().equals(user.getUsername()) && userRepository.existsByUsername(req.username())) {
                throw new EmailAlreadyExistsException("Username already taken: " + req.username());
            }
            user.setUsername(req.username());
        }
        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl().isBlank() ? null : req.avatarUrl());
        }
        return toProfile(userRepository.save(user));
    }

    public void changePassword(String email, ChangePasswordRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    public void deleteAccount(String email, HttpServletResponse response) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        refreshTokenRepository.deleteByUser(user);
        userRepository.delete(user);
        clearRefreshCookie(response);
    }

    // --- helpers ---

    private String issueVerificationToken(User user) {
        String raw = UUID.randomUUID().toString();
        EmailVerificationToken vt = new EmailVerificationToken();
        vt.setUser(user);
        vt.setToken(raw);
        vt.setExpiresAt(java.time.OffsetDateTime.now().plusHours(24));
        verificationTokenRepository.save(vt);
        return raw;
    }

    private AuthResponse issueTokens(User user, HttpServletResponse response) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateAccessToken(userDetails);

        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = jwtUtil.generateRefreshTokenHash(rawRefreshToken);

        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(tokenHash);
        rt.setExpiresAt(OffsetDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000));
        refreshTokenRepository.save(rt);

        setRefreshCookie(response, rawRefreshToken);

        return new AuthResponse(accessToken, toProfile(user));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getUsername(), user.getAvatarUrl());
    }

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge((int) (refreshTokenExpiryMs / 1000));
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
