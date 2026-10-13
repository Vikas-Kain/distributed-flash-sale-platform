package com.platform.ticketing.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailReceiptService {

    public void sendBookingConfirmationEmail(OrderPlacedEvent event) {
        log.info("---------------------------------------------------------------");
        log.info("[EMAIL NOTIFIER] Dispatching order receipt to: {}", event.getUserEmail());
        log.info("  Subject: Your Tickets for '{}' are Confirmed! [Order #{}]", 
                event.getEventTitle(), event.getOrderReference());
        log.info("  Message: Dear {}, thank you for your booking of {} seat(s) [{}]. Total: ${}",
                event.getUserName(), event.getSeatNumbers().size(), 
                String.join(", ", event.getSeatNumbers()), event.getTotalAmount());
        log.info("  Download Link: https://ticketing-platform.local/my-bookings/{}", event.getOrderReference());
        log.info("---------------------------------------------------------------");
    }
}
