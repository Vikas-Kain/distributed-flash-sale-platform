package com.platform.ticketing.dto.response;

import com.platform.ticketing.entity.enums.PaymentStatus;
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
public class PaymentResponse {
    private Long id;
    private String paymentReference;
    private String paymentMethod;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDateTime processedAt;
}
