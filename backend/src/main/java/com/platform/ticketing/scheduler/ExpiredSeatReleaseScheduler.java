package com.platform.ticketing.scheduler;

import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.enums.BookingStatus;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import com.platform.ticketing.service.SeatLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class ExpiredSeatReleaseScheduler {

    private final ShowSeatRepository showSeatRepository;
    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;

    /**
     * Fallback cron job to unlock expired held seats and mark stale pending orders as EXPIRED.
     * Executes every 30 seconds.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void releaseExpiredSeatLocks() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Find expired show seats
        List<ShowSeat> expiredSeats = showSeatRepository.findByStatusAndLockExpirationTimeBefore(SeatStatus.LOCKED, now);

        if (!expiredSeats.isEmpty()) {
            log.info("[SCHEDULER] Found {} expired locked seat(s) to release back into pool", expiredSeats.size());

            Map<Long, List<Long>> seatsByEvent = expiredSeats.stream()
                    .collect(Collectors.groupingBy(
                            ss -> ss.getEvent().getId(),
                            Collectors.mapping(ShowSeat::getId, Collectors.toList())
                    ));

            for (ShowSeat seat : expiredSeats) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setLockedByUserId(null);
                seat.setLockExpirationTime(null);
                seat.setBooking(null);
            }
            showSeatRepository.saveAll(expiredSeats);

            // Release Redisson lock keys
            seatsByEvent.forEach(seatLockService::unlockSeats);
        }

        // 2. Mark corresponding expired pending bookings
        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING, now);
        if (!expiredBookings.isEmpty()) {
            log.info("[SCHEDULER] Found {} expired pending booking(s). Updating status to EXPIRED.", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                booking.setStatus(BookingStatus.EXPIRED);
            }
            bookingRepository.saveAll(expiredBookings);
        }
    }
}
