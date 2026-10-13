package com.platform.ticketing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private VenueResponse venue;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String bannerUrl;
    private LocalDateTime createdAt;

    // Computed real-time fields
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private int totalSeats;
    private int availableSeats;
}
