package com.platform.ticketing.repository;

import com.platform.ticketing.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e JOIN FETCH e.venue WHERE e.id = :id")
    Optional<Event> findByIdWithVenue(@Param("id") Long id);

    @Query("SELECT e FROM Event e JOIN e.venue v WHERE " +
           "(:category IS NULL OR LOWER(e.category) = LOWER(:category)) AND " +
           "(:city IS NULL OR LOWER(v.city) = LOWER(:city)) AND " +
           "(:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Event> findByFilters(
            @Param("category") String category,
            @Param("city") String city,
            @Param("search") String search,
            Pageable pageable
    );

    long countByStartTimeAfter(LocalDateTime now);
}
