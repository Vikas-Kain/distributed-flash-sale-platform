package com.platform.ticketing.controller;

import com.platform.ticketing.dto.response.BookingResponse;
import com.platform.ticketing.dto.response.UserResponse;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.service.AuthService;
import com.platform.ticketing.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User profile and personal booking history")
public class UserController {

    private final AuthService authService;
    private final BookingService bookingService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = authService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/bookings")
    @Operation(summary = "Get personal booking history and e-tickets")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserEntity(userDetails.getUsername());
        List<BookingResponse> bookings = bookingService.getUserBookings(user.getId());
        return ResponseEntity.ok(bookings);
    }
}
