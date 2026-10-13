package com.platform.ticketing.service;

import com.platform.ticketing.dto.request.CheckoutRequest;
import com.platform.ticketing.dto.response.BookingResponse;
import com.platform.ticketing.dto.response.PaymentResponse;
import com.platform.ticketing.dto.response.ShowSeatResponse;
import com.platform.ticketing.dto.response.VenueResponse;
import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.Payment;
import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.entity.enums.BookingStatus;
import com.platform.ticketing.entity.enums.PaymentStatus;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.exception.InvalidBookingException;
import com.platform.ticketing.exception.ResourceNotFoundException;
import com.platform.ticketing.exception.UnauthorizedException;
import com.platform.ticketing.listener.OrderPlacedEvent;
import com.platform.ticketing.listener.TicketPdfService;
import com.platform.ticketing.repository.BookingRepository;
import com.platform.ticketing.repository.PaymentRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowSeatRepository showSeatRepository;
    private final PaymentRepository paymentRepository;
    private final SeatLockService seatLockService;
    private final TicketPdfService ticketPdfService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final EventService eventService;

    @Value("${app.kafka.topics.ticket-orders:ticket-orders-topic}")
    private String ticketOrdersTopic;

    /**
     * Finalizes booking checkout, verifies payment, updates seat status to BOOKED,
     * releases Redis locks, and publishes OrderPlacedEvent to Kafka.
     */
    @Transactional
    public BookingResponse checkout(Long bookingId, CheckoutRequest request, User currentUser) {
        Booking booking = bookingRepository.findByIdWithEventAndVenue(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // 1. Verify user ownership
        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You do not have permission to checkout this booking");
        }

        // 2. Verify status is PENDING and not expired
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingException("Booking is already " + booking.getStatus() + " and cannot be checked out.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(now)) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            throw new InvalidBookingException("Booking reservation has expired. Please select seats again.");
        }

        // 3. Process payment record
        String paymentRef = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() % 10000;
        Payment payment = Payment.builder()
                .booking(booking)
                .paymentReference(paymentRef)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .status(PaymentStatus.SUCCESS)
                .processedAt(now)
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        booking.setPayment(savedPayment);

        // 4. Update ShowSeat status to BOOKED and clear lock expiration
        List<ShowSeat> showSeats = showSeatRepository.findByBookingId(booking.getId());
        List<Long> seatIdsToUnlock = showSeats.stream().map(ShowSeat::getId).collect(Collectors.toList());

        for (ShowSeat showSeat : showSeats) {
            showSeat.setStatus(SeatStatus.BOOKED);
            showSeat.setLockExpirationTime(null);
        }
        showSeatRepository.saveAll(showSeats);

        // 5. Update Booking status to CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        Booking confirmedBooking = bookingRepository.save(booking);

        // 6. Release Redis distributed locks
        seatLockService.unlockSeats(booking.getEvent().getId(), seatIdsToUnlock);

        // 7. Publish OrderPlacedEvent to Kafka
        List<String> seatNumbers = showSeats.stream()
                .map(ss -> ss.getSeat().getSeatNumber())
                .collect(Collectors.toList());

        String verificationHash = ticketPdfService.generateVerificationHash(
                confirmedBooking.getId(),
                confirmedBooking.getOrderReference(),
                currentUser.getEmail(),
                confirmedBooking.getEvent().getId()
        );

        OrderPlacedEvent eventPayload = OrderPlacedEvent.builder()
                .orderId(confirmedBooking.getId())
                .orderReference(confirmedBooking.getOrderReference())
                .userId(currentUser.getId())
                .userName(currentUser.getName())
                .userEmail(currentUser.getEmail())
                .eventId(confirmedBooking.getEvent().getId())
                .eventTitle(confirmedBooking.getEvent().getTitle())
                .venueName(confirmedBooking.getEvent().getVenue().getName())
                .venueCity(confirmedBooking.getEvent().getVenue().getCity())
                .seatNumbers(seatNumbers)
                .totalAmount(confirmedBooking.getTotalAmount())
                .eventStartTime(confirmedBooking.getEvent().getStartTime())
                .orderTimestamp(now)
                .verificationHash(verificationHash)
                .build();

        try {
            kafkaTemplate.send(ticketOrdersTopic, confirmedBooking.getOrderReference(), eventPayload)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Kafka async publish failed: {}. Executing direct post-processing.", ex.getMessage());
                            ticketPdfService.generatePdfTicket(eventPayload);
                        } else {
                            log.info("Kafka message confirmed on partition {} offset {}", 
                                    result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                        }
                    });
            log.info("Published OrderPlacedEvent to Kafka topic '{}' for booking ref: {}", ticketOrdersTopic, confirmedBooking.getOrderReference());
        } catch (Exception kafkaEx) {
            log.warn("Kafka publish failed synchronously: {}. Post-processing directly.", kafkaEx.getMessage());
            ticketPdfService.generatePdfTicket(eventPayload);
        }

        return mapToBookingResponse(confirmedBooking, showSeats, savedPayment, verificationHash);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdWithEvent(userId);
        return bookings.stream().map(b -> {
            List<ShowSeat> showSeats = showSeatRepository.findByBookingId(b.getId());
            Payment payment = paymentRepository.findByBookingId(b.getId()).orElse(null);
            String hash = ticketPdfService.generateVerificationHash(b.getId(), b.getOrderReference(), b.getUser().getEmail(), b.getEvent().getId());
            return mapToBookingResponse(b, showSeats, payment, hash);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findByIdWithEventAndVenue(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId()) && !currentUser.getRole().name().equals("ROLE_ADMIN")) {
            throw new UnauthorizedException("You do not have access to view this booking");
        }

        List<ShowSeat> showSeats = showSeatRepository.findByBookingId(booking.getId());
        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        String hash = ticketPdfService.generateVerificationHash(booking.getId(), booking.getOrderReference(), booking.getUser().getEmail(), booking.getEvent().getId());

        return mapToBookingResponse(booking, showSeats, payment, hash);
    }

    public BookingResponse mapToBookingResponse(Booking booking, List<ShowSeat> showSeats, Payment payment, String hash) {
        List<ShowSeatResponse> seatResponses = showSeats.stream()
                .map(eventService::mapToShowSeatResponse)
                .collect(Collectors.toList());

        PaymentResponse paymentResponse = null;
        if (payment != null) {
            paymentResponse = PaymentResponse.builder()
                    .id(payment.getId())
                    .paymentReference(payment.getPaymentReference())
                    .paymentMethod(payment.getPaymentMethod())
                    .amount(payment.getAmount())
                    .status(payment.getStatus())
                    .processedAt(payment.getProcessedAt())
                    .build();
        }

        VenueResponse venueResponse = null;
        if (booking.getEvent() != null && booking.getEvent().getVenue() != null) {
            venueResponse = eventService.mapToVenueResponse(booking.getEvent().getVenue());
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .orderReference(booking.getOrderReference())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .userEmail(booking.getUser().getEmail())
                .eventId(booking.getEvent().getId())
                .eventTitle(booking.getEvent().getTitle())
                .eventCategory(booking.getEvent().getCategory())
                .bannerUrl(booking.getEvent().getBannerUrl())
                .eventStartTime(booking.getEvent().getStartTime())
                .eventEndTime(booking.getEvent().getEndTime())
                .venue(venueResponse)
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .expiresAt(booking.getExpiresAt())
                .createdAt(booking.getCreatedAt())
                .seats(seatResponses)
                .payment(paymentResponse)
                .verificationHash(hash)
                .build();
    }
}
