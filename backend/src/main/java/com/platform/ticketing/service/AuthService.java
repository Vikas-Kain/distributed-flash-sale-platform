package com.platform.ticketing.service;

import com.platform.ticketing.config.JwtTokenProvider;
import com.platform.ticketing.dto.request.LoginRequest;
import com.platform.ticketing.dto.request.RegisterRequest;
import com.platform.ticketing.dto.response.AuthResponse;
import com.platform.ticketing.dto.response.UserResponse;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.entity.enums.Role;
import com.platform.ticketing.exception.ConflictException;
import com.platform.ticketing.exception.ResourceNotFoundException;
import com.platform.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_CUSTOMER)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new customer: {} ({})", savedUser.getName(), savedUser.getEmail());

        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    @Transactional(readOnly = true)
    public User getCurrentUserEntity(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
