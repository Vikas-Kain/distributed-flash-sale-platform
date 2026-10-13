package com.platform.ticketing.dto.request;

import jakarta.validation.constraints.Min;
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
public class VenueCreateRequest {

    @NotBlank(message = "Venue name is required")
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Address is required")
    private String address;

    @NotNull(message = "VIP row count is required")
    @Min(1)
    private Integer vipRows;

    @NotNull(message = "VIP seats per row is required")
    @Min(1)
    private Integer vipSeatsPerRow;

    private BigDecimal vipBasePrice;

    @NotNull(message = "Premium row count is required")
    @Min(1)
    private Integer premiumRows;

    @NotNull(message = "Premium seats per row is required")
    @Min(1)
    private Integer premiumSeatsPerRow;

    private BigDecimal premiumBasePrice;

    @NotNull(message = "Standard row count is required")
    @Min(1)
    private Integer standardRows;

    @NotNull(message = "Standard seats per row is required")
    @Min(1)
    private Integer standardSeatsPerRow;

    private BigDecimal standardBasePrice;
}
