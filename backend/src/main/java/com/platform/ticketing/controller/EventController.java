package com.platform.ticketing.controller;

import com.platform.ticketing.dto.request.SeatLockRequest;
import com.platform.ticketing.dto.response.EventResponse;
import com.platform.ticketing.dto.response.SeatLockResponse;
import com.platform.ticketing.dto.response.SeatMapResponse;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.service.AuthService;
import com.platform.ticketing.service.EventService;
import com.platform.ticketing.service.SeatLockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events & Seat Map", description = "Public catalog queries and seat locking engine")
public class EventController {

    private final EventService eventService;
    private final SeatLockService seatLockService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Get paginated events with optional filters (city, category, search)")
    public ResponseEntity<Page<EventResponse>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search
    ) {
        Page<EventResponse> events = eventService.getEvents(page, size, category, city, search);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed information for a specific event")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        EventResponse event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/{id}/seat-map")
    @Operation(summary = "Get real-time seat matrix and availability status for an event")
    public ResponseEntity<SeatMapResponse> getEventSeatMap(@PathVariable Long id) {
        SeatMapResponse seatMap = eventService.getEventSeatMap(id);
        return ResponseEntity.ok(seatMap);
    }

    @PostMapping("/{eventId}/seats/lock")
    @Operation(summary = "Acquire high-concurrency distributed lock and hold seats for 10 minutes")
    public ResponseEntity<SeatLockResponse> lockSeats(
            @PathVariable Long eventId,
            @Valid @RequestBody SeatLockRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = authService.getCurrentUserEntity(userDetails.getUsername());
        SeatLockResponse response = seatLockService.lockSeats(eventId, request, user);
        return ResponseEntity.ok(response);
    }
}
