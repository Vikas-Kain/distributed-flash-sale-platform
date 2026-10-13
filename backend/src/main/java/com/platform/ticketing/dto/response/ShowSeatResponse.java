package com.platform.ticketing.dto.response;

import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.entity.enums.SeatTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowSeatResponse {
    private Long id; // ShowSeat ID
    private Long seatId; // Base Seat ID
    private String seatNumber; // e.g. "A12"
    private SeatTier seatTier; // VIP, PREMIUM, STANDARD
    private SeatStatus status; // AVAILABLE, LOCKED, BOOKED
    private BigDecimal price;
    private Long lockedByUserId;
    private LocalDateTime lockExpirationTime;
}
