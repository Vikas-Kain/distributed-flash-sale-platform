package com.platform.ticketing.service;

import com.platform.ticketing.dto.request.SeatLockRequest;
import com.platform.ticketing.dto.response.SeatLockResponse;
import com.platform.ticketing.dto.response.ShowSeatResponse;
import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.Event;
import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.entity.enums.BookingStatus;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.exception.ConflictException;
import com.platform.ticketing.exception.ResourceNotFoundException;
import com.platform.ticketing.exception.SeatUnavailableException;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.EventRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedissonClient redissonClient;
    private final ShowSeatRepository showSeatRepository;
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;

    @Value("${app.seat-lock.timeout-minutes:10}")
    private int lockTimeoutMinutes;

    private static final long LOCK_WAIT_TIME_SEC = 3;
    private static final long LOCK_LEASE_TIME_MIN = 10;

    /**
     * Acquires distributed locks, verifies seat availability in an isolated transaction,
     * updates ShowSeat records to LOCKED, and creates a PENDING booking.
     */
    public SeatLockResponse lockSeats(Long eventId, SeatLockRequest request, User user) {
        List<Long> seatIds = request.getSeatIds();
        if (seatIds == null || seatIds.isEmpty()) {
            throw new IllegalArgumentException("Seat IDs list cannot be empty");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        // 1. Sort seat IDs to prevent deadlocks across concurrent requests
        List<Long> sortedSeatIds = new ArrayList<>(seatIds);
        Collections.sort(sortedSeatIds);

        List<RLock> acquiredLocks = new ArrayList<>();

        try {
            // 2. Acquire Fair Distributed Locks for each seat via Redisson
            for (Long seatId : sortedSeatIds) {
                String lockKey = String.format("lock:event:%d:seat:%d", eventId, seatId);
                RLock lock = redissonClient.getFairLock(lockKey);
                try {
                    boolean locked = lock.tryLock(LOCK_WAIT_TIME_SEC, LOCK_LEASE_TIME_MIN, TimeUnit.MINUTES);
                    if (!locked) {
                        log.warn("Failed to acquire distributed lock for key: {}", lockKey);
                        throw new SeatUnavailableException("Seat is currently being locked by another customer", seatId);
                    }
                    acquiredLocks.add(lock);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new ConflictException("Seat lock acquisition interrupted: " + seatId);
                } catch (Exception e) {
                    if (e instanceof SeatUnavailableException) {
                        throw e;
                    }
                    log.warn("Redisson lock failed: {}. Continuing with transactional DB optimistic check.", e.getMessage());
                }
            }

            // 3. Execute transactional seat validation and state transition
            return executeSeatLockingTransaction(eventId, sortedSeatIds, user, event);

        } finally {
            // Distributed mutex was protecting the critical transactional boundary
            releaseLocks(acquiredLocks);
        }
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SeatLockResponse executeSeatLockingTransaction(Long eventId, List<Long> seatIds, User user, Event event) {
        List<ShowSeat> showSeats = showSeatRepository.findByEventIdAndIdIn(eventId, seatIds);

        if (showSeats.size() != seatIds.size()) {
            Set<Long> foundIds = showSeats.stream().map(ShowSeat::getId).collect(Collectors.toSet());
            List<Long> missing = seatIds.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toList());
            throw new ResourceNotFoundException("ShowSeats not found for event: " + missing);
        }

        LocalDateTime now = LocalDateTime.now();
        List<Long> conflictingSeatIds = new ArrayList<>();

        // Check availability
        for (ShowSeat showSeat : showSeats) {
            if (showSeat.getStatus() == SeatStatus.BOOKED) {
                conflictingSeatIds.add(showSeat.getId());
            } else if (showSeat.getStatus() == SeatStatus.LOCKED) {
                // If lock has NOT expired and is not owned by current user
                if (showSeat.getLockExpirationTime() != null && showSeat.getLockExpirationTime().isAfter(now)) {
                    if (showSeat.getLockedByUserId() == null || !showSeat.getLockedByUserId().equals(user.getId())) {
                        conflictingSeatIds.add(showSeat.getId());
                    }
                }
            }
        }

        if (!conflictingSeatIds.isEmpty()) {
            throw new SeatUnavailableException("One or more selected seats are no longer available", conflictingSeatIds);
        }

        LocalDateTime expirationTime = now.plusMinutes(lockTimeoutMinutes);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ShowSeat showSeat : showSeats) {
            showSeat.setStatus(SeatStatus.LOCKED);
            showSeat.setLockedByUserId(user.getId());
            showSeat.setLockExpirationTime(expirationTime);
            totalAmount = totalAmount.add(showSeat.getPrice());
        }

        // Create PENDING booking
        String orderReference = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() % 10000;

        Booking booking = Booking.builder()
                .orderReference(orderReference)
                .user(user)
                .event(event)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .expiresAt(expirationTime)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        for (ShowSeat showSeat : showSeats) {
            showSeat.setBooking(savedBooking);
        }
        showSeatRepository.saveAll(showSeats);

        log.info("Successfully locked {} seats for event '{}' by user '{}'. Booking ID: {}, Reference: {}",
                showSeats.size(), event.getTitle(), user.getEmail(), savedBooking.getId(), orderReference);

        List<ShowSeatResponse> seatResponses = showSeats.stream()
                .map(eventService::mapToShowSeatResponse)
                .collect(Collectors.toList());

        long expiresInSeconds = Duration.between(now, expirationTime).getSeconds();

        return SeatLockResponse.builder()
                .bookingId(savedBooking.getId())
                .orderReference(orderReference)
                .reservationToken(UUID.randomUUID().toString())
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .totalAmount(totalAmount)
                .lockExpirationTime(expirationTime)
                .expiresInSeconds(expiresInSeconds)
                .lockedSeats(seatResponses)
                .build();
    }

    public void unlockSeats(Long eventId, List<Long> seatIds) {
        for (Long seatId : seatIds) {
            String lockKey = String.format("lock:event:%d:seat:%d", eventId, seatId);
            try {
                RLock lock = redissonClient.getFairLock(lockKey);
                if (lock.isLocked() && lock.isHeldByCurrentThread()) {
                    lock.unlock();
                } else if (lock.isLocked()) {
                    lock.forceUnlock();
                }
            } catch (Exception ex) {
                log.debug("Unlocking key {} resulted in: {}", lockKey, ex.getMessage());
            }
        }
    }

    private void releaseLocks(List<RLock> locks) {
        for (RLock lock : locks) {
            try {
                if (lock.isLocked() && lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            } catch (Exception e) {
                log.warn("Error releasing lock: {}", e.getMessage());
            }
        }
    }
}
