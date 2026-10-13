package com.platform.ticketing.repository;

import com.platform.ticketing.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByVenueIdOrderBySeatNumberAsc(Long venueId);
}
