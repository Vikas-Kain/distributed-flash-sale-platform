package com.platform.ticketing.repository;

import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowSeatRepository extends JpaRepository<ShowSeat, Long> {

    @Query("SELECT ss FROM ShowSeat ss JOIN FETCH ss.seat s WHERE ss.event.id = :eventId ORDER BY s.seatTier ASC, s.seatNumber ASC")
    List<ShowSeat> findByEventIdWithSeat(@Param("eventId") Long eventId);

    @Query("SELECT ss FROM ShowSeat ss JOIN FETCH ss.seat s WHERE ss.id IN :ids")
    List<ShowSeat> findByIdInWithSeat(@Param("ids") List<Long> ids);

    @Query("SELECT ss FROM ShowSeat ss WHERE ss.event.id = :eventId AND ss.id IN :ids")
    List<ShowSeat> findByEventIdAndIdIn(@Param("eventId") Long eventId, @Param("ids") List<Long> ids);

    Optional<ShowSeat> findByEventIdAndSeatId(Long eventId, Long seatId);

    List<ShowSeat> findByStatusAndLockExpirationTimeBefore(SeatStatus status, LocalDateTime now);

    long countByEventIdAndStatus(Long eventId, SeatStatus status);

    long countByStatus(SeatStatus status);

    @Query("SELECT ss FROM ShowSeat ss WHERE ss.booking.id = :bookingId")
    List<ShowSeat> findByBookingId(@Param("bookingId") Long bookingId);
}
