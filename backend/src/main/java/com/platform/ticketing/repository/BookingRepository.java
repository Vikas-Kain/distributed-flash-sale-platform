package com.platform.ticketing.repository;

import com.platform.ticketing.entity.Booking;
import com.platform.ticketing.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByOrderReference(String orderReference);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event e JOIN FETCH e.venue WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdWithEvent(@Param("userId") Long userId);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime now);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") BookingStatus status);

    long countByStatus(BookingStatus status);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event e JOIN FETCH e.venue WHERE b.id = :id")
    Optional<Booking> findByIdWithEventAndVenue(@Param("id") Long id);
}
