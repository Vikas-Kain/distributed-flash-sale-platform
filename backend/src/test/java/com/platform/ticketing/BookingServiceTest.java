package com.platform.ticketing;

import com.platform.ticketing.dto.request.CheckoutRequest;
import com.platform.ticketing.dto.response.BookingResponse;
import com.platform.ticketing.entity.*;
import com.platform.ticketing.entity.enums.BookingStatus;
import com.platform.ticketing.entity.enums.Role;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.entity.enums.SeatTier;
import com.platform.ticketing.exception.InvalidBookingException;
import com.platform.ticketing.listener.TicketPdfService;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.PaymentRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import com.platform.ticketing.service.BookingService;
import com.platform.ticketing.service.EventService;
import com.platform.ticketing.service.SeatLockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ShowSeatRepository showSeatRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SeatLockService seatLockService;

    @Mock
    private TicketPdfService ticketPdfService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Mock
    private EventService eventService;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Venue testVenue;
    private Event testEvent;
    private Seat testSeat;
    private ShowSeat lockedShowSeat;
    private Booking pendingBooking;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Alex Johnson")
                .email("alex@example.com")
                .role(Role.ROLE_CUSTOMER)
                .build();

        testVenue = Venue.builder()
                .id(10L)
                .name("Madison Square Garden")
                .city("New York")
                .build();

        testEvent = Event.builder()
                .id(100L)
                .title("Coldplay Neon Tour")
                .venue(testVenue)
                .startTime(LocalDateTime.now().plusDays(2))
                .build();

        testSeat = Seat.builder()
                .id(20L)
                .seatNumber("VIP-1")
                .seatTier(SeatTier.VIP)
                .build();

        lockedShowSeat = ShowSeat.builder()
                .id(1L)
                .event(testEvent)
                .seat(testSeat)
                .status(SeatStatus.LOCKED)
                .price(BigDecimal.valueOf(199.99))
                .build();

        pendingBooking = Booking.builder()
                .id(50L)
                .orderReference("ORD-TEST-1234")
                .user(testUser)
                .event(testEvent)
                .totalAmount(BigDecimal.valueOf(199.99))
                .status(BookingStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(8))
                .build();
    }

    @Test
    @DisplayName("Should successfully checkout pending booking and publish Kafka event")
    void testCheckout_Success() {
        when(bookingRepository.findByIdWithEventAndVenue(50L)).thenReturn(Optional.of(pendingBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(showSeatRepository.findByBookingId(50L)).thenReturn(Collections.singletonList(lockedShowSeat));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(ticketPdfService.generateVerificationHash(anyLong(), anyString(), anyString(), anyLong()))
                .thenReturn("HASH-XYZ-999");

        CheckoutRequest request = CheckoutRequest.builder()
                .paymentMethod("CREDIT_CARD")
                .amount(BigDecimal.valueOf(199.99))
                .build();

        BookingResponse response = bookingService.checkout(50L, request, testUser);

        assertNotNull(response);
        assertEquals(BookingStatus.CONFIRMED, response.getStatus());
        assertEquals(SeatStatus.BOOKED, lockedShowSeat.getStatus());
        verify(seatLockService, times(1)).unlockSeats(eq(100L), anyList());
        verify(kafkaTemplate, times(1)).send(any(), any(), any());
    }

    @Test
    @DisplayName("Should throw InvalidBookingException when booking has expired")
    void testCheckout_ExpiredBooking() {
        pendingBooking.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // Expired

        when(bookingRepository.findByIdWithEventAndVenue(50L)).thenReturn(Optional.of(pendingBooking));

        CheckoutRequest request = CheckoutRequest.builder()
                .paymentMethod("CREDIT_CARD")
                .amount(BigDecimal.valueOf(199.99))
                .build();

        assertThrows(InvalidBookingException.class, () -> {
            bookingService.checkout(50L, request, testUser);
        });

        assertEquals(BookingStatus.EXPIRED, pendingBooking.getStatus());
    }
}
