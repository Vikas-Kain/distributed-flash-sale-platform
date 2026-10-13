package com.platform.ticketing.entity;

import com.platform.ticketing.entity.enums.SeatTier;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "seats", indexes = {
    @Index(name = "idx_seats_venue_id", columnList = "venue_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber; // e.g., "A12", "VIP-1"

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_tier", nullable = false)
    private SeatTier seatTier;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;
}
