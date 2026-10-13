package com.platform.ticketing.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaOrderListener {

    private final TicketPdfService ticketPdfService;
    private final EmailReceiptService emailReceiptService;

    @KafkaListener(
        topics = "${app.kafka.topics.ticket-orders:ticket-orders-topic}",
        groupId = "${spring.kafka.consumer.group-id:ticketing-group}",
        autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("[KAFKA CONSUMER] Received OrderPlacedEvent for order: {}", event.getOrderReference());
        try {
            // 1. Generate PDF Ticket with QR verification hash
            ticketPdfService.generatePdfTicket(event);

            // 2. Dispatch Email Confirmation
            emailReceiptService.sendBookingConfirmationEmail(event);

            log.info("[KAFKA CONSUMER] Successfully finalized post-booking operations for order: {}", event.getOrderReference());
        } catch (Exception ex) {
            log.error("[KAFKA CONSUMER] Failed to process OrderPlacedEvent for order {}: {}", event.getOrderReference(), ex.getMessage(), ex);
        }
    }
}
