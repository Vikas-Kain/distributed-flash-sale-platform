package com.platform.ticketing.listener;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent implements Serializable {
    private Long orderId;
    private String orderReference;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long eventId;
    private String eventTitle;
    private String venueName;
    private String venueCity;
    private List<String> seatNumbers;
    private BigDecimal totalAmount;
    private LocalDateTime eventStartTime;
    private LocalDateTime orderTimestamp;
    private String verificationHash;
}
