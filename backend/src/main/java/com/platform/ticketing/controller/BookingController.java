package com.platform.ticketing.controller;

import com.platform.ticketing.dto.request.CheckoutRequest;
import com.platform.ticketing.dto.response.BookingResponse;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.service.AuthService;
import com.platform.ticketing.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings & Checkout", description = "Order checkout, payment finalization, and ticket retrieval")
public class BookingController {

    private final BookingService bookingService;
    private final AuthService authService;

    @PostMapping("/{orderId}/checkout")
    @Operation(summary = "Finalize booking order payment and trigger Kafka event pipeline")
    public ResponseEntity<BookingResponse> checkout(
            @PathVariable Long orderId,
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = authService.getCurrentUserEntity(userDetails.getUsername());
        BookingResponse response = bookingService.checkout(orderId, request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific booking details and digital e-ticket verification")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = authService.getCurrentUserEntity(userDetails.getUsername());
        BookingResponse response = bookingService.getBookingById(id, user);
        return ResponseEntity.ok(response);
    }
}
