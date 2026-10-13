package com.platform.ticketing.dto.response;

import com.platform.ticketing.entity.enums.BookingStatus;
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
public class BookingResponse {
    private Long id;
    private String orderReference;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long eventId;
    private String eventTitle;
    private String eventCategory;
    private String bannerUrl;
    private LocalDateTime eventStartTime;
    private LocalDateTime eventEndTime;
    private VenueResponse venue;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private List<ShowSeatResponse> seats;
    private PaymentResponse payment;
    private String verificationHash;
}
