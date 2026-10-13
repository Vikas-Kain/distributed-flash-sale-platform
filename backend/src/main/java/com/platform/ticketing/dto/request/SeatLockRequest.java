package com.platform.ticketing.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatLockRequest {

    @NotEmpty(message = "At least one seatId must be provided")
    private List<Long> seatIds;
}
