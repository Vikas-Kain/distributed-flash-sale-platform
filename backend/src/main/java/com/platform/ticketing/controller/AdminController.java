package com.platform.ticketing.controller;

import com.platform.ticketing.dto.request.EventCreateRequest;
import com.platform.ticketing.dto.request.VenueCreateRequest;
import com.platform.ticketing.dto.response.AnalyticsResponse;
import com.platform.ticketing.dto.response.EventResponse;
import com.platform.ticketing.dto.response.VenueResponse;
import com.platform.ticketing.service.AnalyticsService;
import com.platform.ticketing.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Privileged endpoints for event creation, venue management, and revenue analytics")
public class AdminController {

    private final EventService eventService;
    private final AnalyticsService analyticsService;

    @PostMapping("/events")
    @Operation(summary = "Create a new event and generate tiered show seats")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventCreateRequest request) {
        EventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/events/{id}")
    @Operation(summary = "Update event details and evict Redis catalog cache")
    public ResponseEntity<EventResponse> updateEvent(@PathVariable Long id, @Valid @RequestBody EventCreateRequest request) {
        EventResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/venues")
    @Operation(summary = "Create venue with automatic seat tier layout matrix")
    public ResponseEntity<VenueResponse> createVenue(@Valid @RequestBody VenueCreateRequest request) {
        VenueResponse response = eventService.createVenue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/venues")
    @Operation(summary = "List all available venues")
    public ResponseEntity<List<VenueResponse>> getVenues() {
        List<VenueResponse> venues = eventService.getAllVenues();
        return ResponseEntity.ok(venues);
    }

    @GetMapping("/analytics/sales")
    @Operation(summary = "Get high-level sales KPIs, occupancy rates, and category revenue")
    public ResponseEntity<AnalyticsResponse> getSalesAnalytics() {
        AnalyticsResponse response = analyticsService.getSalesAnalytics();
        return ResponseEntity.ok(response);
    }
}
