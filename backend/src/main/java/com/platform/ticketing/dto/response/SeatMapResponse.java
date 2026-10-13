package com.platform.ticketing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapResponse {
    private Long eventId;
    private String eventTitle;
    private VenueResponse venue;
    private int totalSeats;
    private int availableSeats;
    private int lockedSeats;
    private int bookedSeats;
    private List<ShowSeatResponse> seats;
    private Map<String, List<ShowSeatResponse>> seatsByTier;
}
