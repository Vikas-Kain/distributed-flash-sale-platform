package com.platform.ticketing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private BigDecimal totalRevenue;
    private long totalTicketsSold;
    private long totalBookings;
    private long activeEventsCount;
    private double overallOccupancyRate;
    private Map<String, BigDecimal> revenueByCategory;
    private Map<String, Long> salesByCategory;
    private List<BookingResponse> recentBookings;
}
