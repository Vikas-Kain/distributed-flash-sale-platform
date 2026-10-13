package com.platform.ticketing.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // e.g. CREDIT_CARD, DEBIT_CARD, UPI, MOCK_INSTANT

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
}
