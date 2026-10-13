package com.platform.ticketing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatLockResponse {
    private Long bookingId;
    private String orderReference;
    private String reservationToken;
    private Long eventId;
    private String eventTitle;
    private BigDecimal totalAmount;
    private LocalDateTime lockExpirationTime;
    private long expiresInSeconds;
    private List<ShowSeatResponse> lockedSeats;
}
