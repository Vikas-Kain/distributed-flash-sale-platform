package com.platform.ticketing;

import com.platform.ticketing.dto.request.SeatLockRequest;
import com.platform.ticketing.dto.response.SeatLockResponse;
import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.Event;
import com.platform.ticketing.entity.Seat;
import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.entity.enums.Role;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.entity.enums.SeatTier;
import com.platform.ticketing.exception.SeatUnavailableException;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.EventRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import com.platform.ticketing.service.EventService;
import com.platform.ticketing.service.SeatLockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeatLockServiceTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private ShowSeatRepository showSeatRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventService eventService;

    @Mock
    private RLock rLock;

    @InjectMocks
    private SeatLockService seatLockService;

    private User testUser;
    private Event testEvent;
    private Seat testSeat;
    private ShowSeat availableShowSeat;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Alex Johnson")
                .email("alex@example.com")
                .role(Role.ROLE_CUSTOMER)
                .build();

        testEvent = Event.builder()
                .id(100L)
                .title("Coldplay Live")
                .build();

        testSeat = Seat.builder()
                .id(10L)
                .seatNumber("A1")
                .seatTier(SeatTier.VIP)
                .basePrice(BigDecimal.valueOf(150.0))
                .build();

        availableShowSeat = ShowSeat.builder()
                .id(1L)
                .event(testEvent)
                .seat(testSeat)
                .status(SeatStatus.AVAILABLE)
                .price(BigDecimal.valueOf(150.0))
                .build();
    }

    @Test
    @DisplayName("Should successfully lock available seat and create PENDING booking")
    void testLockSeats_Success() throws InterruptedException {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(testEvent));
        when(redissonClient.getFairLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(showSeatRepository.findByEventIdAndIdIn(eq(100L), anyList())).thenReturn(Collections.singletonList(availableShowSeat));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(500L);
            return b;
        });

        SeatLockRequest request = SeatLockRequest.builder()
                .seatIds(Collections.singletonList(1L))
                .build();

        SeatLockResponse response = seatLockService.lockSeats(100L, request, testUser);

        assertNotNull(response);
        assertEquals(500L, response.getBookingId());
        assertEquals(100L, response.getEventId());
        assertEquals(SeatStatus.LOCKED, availableShowSeat.getStatus());
        assertEquals(testUser.getId(), availableShowSeat.getLockedByUserId());
        assertNotNull(availableShowSeat.getLockExpirationTime());
    }

    @Test
    @DisplayName("Should throw SeatUnavailableException (409 Conflict) when seat is already booked")
    void testLockSeats_ConflictWhenAlreadyBooked() throws InterruptedException {
        availableShowSeat.setStatus(SeatStatus.BOOKED);

        when(eventRepository.findById(100L)).thenReturn(Optional.of(testEvent));
        when(redissonClient.getFairLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(showSeatRepository.findByEventIdAndIdIn(eq(100L), anyList())).thenReturn(Collections.singletonList(availableShowSeat));

        SeatLockRequest request = SeatLockRequest.builder()
                .seatIds(Collections.singletonList(1L))
                .build();

        assertThrows(SeatUnavailableException.class, () -> {
            seatLockService.lockSeats(100L, request, testUser);
        });
    }

    @Test
    @DisplayName("Should throw SeatUnavailableException when seat is locked by another user with active timer")
    void testLockSeats_ConflictWhenLockedByAnotherUser() throws InterruptedException {
        availableShowSeat.setStatus(SeatStatus.LOCKED);
        availableShowSeat.setLockedByUserId(999L); // Different user
        availableShowSeat.setLockExpirationTime(LocalDateTime.now().plusMinutes(5));

        when(eventRepository.findById(100L)).thenReturn(Optional.of(testEvent));
        when(redissonClient.getFairLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(showSeatRepository.findByEventIdAndIdIn(eq(100L), anyList())).thenReturn(Collections.singletonList(availableShowSeat));

        SeatLockRequest request = SeatLockRequest.builder()
                .seatIds(Collections.singletonList(1L))
                .build();

        assertThrows(SeatUnavailableException.class, () -> {
            seatLockService.lockSeats(100L, request, testUser);
        });
    }
}
