package com.platform.ticketing.service;

import com.platform.ticketing.dto.response.AnalyticsResponse;
import com.platform.ticketing.dto.response.BookingResponse;
import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.enums.BookingStatus;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.EventRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final ShowSeatRepository showSeatRepository;
    private final EventRepository eventRepository;
    private final BookingService bookingService;

    @Transactional(readOnly = true)
    public AnalyticsResponse getSalesAnalytics() {
        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByStatus(BookingStatus.CONFIRMED);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        long totalBookedSeats = showSeatRepository.countByStatus(SeatStatus.BOOKED);
        long totalAvailableSeats = showSeatRepository.countByStatus(SeatStatus.AVAILABLE);
        long totalLockedSeats = showSeatRepository.countByStatus(SeatStatus.LOCKED);
        long totalSeatsAll = totalBookedSeats + totalAvailableSeats + totalLockedSeats;

        double occupancyRate = totalSeatsAll > 0 ? ((double) totalBookedSeats / totalSeatsAll) * 100.0 : 0.0;
        long totalConfirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long activeEventsCount = eventRepository.countByStartTimeAfter(LocalDateTime.now());

        // Category breakdown
        List<Booking> confirmedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.toList());

        Map<String, BigDecimal> revenueByCategory = new HashMap<>();
        Map<String, Long> salesByCategory = new HashMap<>();

        for (Booking b : confirmedBookings) {
            if (b.getEvent() != null) {
                String cat = b.getEvent().getCategory();
                revenueByCategory.put(cat, revenueByCategory.getOrDefault(cat, BigDecimal.ZERO).add(b.getTotalAmount()));
                long seatCount = b.getShowSeats() != null ? b.getShowSeats().size() : 1;
                salesByCategory.put(cat, salesByCategory.getOrDefault(cat, 0L) + seatCount);
            }
        }

        List<BookingResponse> recentBookings = bookingRepository.findAll(
                PageRequest.of(0, 10, Sort.by("createdAt").descending())
        ).getContent().stream()
                .map(b -> bookingService.mapToBookingResponse(b, showSeatRepository.findByBookingId(b.getId()), b.getPayment(), null))
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalTicketsSold(totalBookedSeats)
                .totalBookings(totalConfirmedBookings)
                .activeEventsCount(activeEventsCount)
                .overallOccupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .revenueByCategory(revenueByCategory)
                .salesByCategory(salesByCategory)
                .recentBookings(recentBookings)
                .build();
    }
}
