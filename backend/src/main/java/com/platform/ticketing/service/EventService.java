package com.platform.ticketing.service;

import com.platform.ticketing.config.RedisCacheConfig;
import com.platform.ticketing.dto.request.EventCreateRequest;
import com.platform.ticketing.dto.request.VenueCreateRequest;
import com.platform.ticketing.dto.response.*;
import com.platform.ticketing.entity.Event;
import com.platform.ticketing.entity.Seat;
import com.platform.ticketing.entity.ShowSeat;
import com.platform.ticketing.entity.Venue;
import com.platform.ticketing.entity.enums.SeatStatus;
import com.platform.ticketing.entity.enums.SeatTier;
import com.platform.ticketing.exception.ResourceNotFoundException;
import com.platform.ticketing.repository.EventRepository;
import com.platform.ticketing.repository.SeatRepository;
import com.platform.ticketing.repository.ShowSeatRepository;
import com.platform.ticketing.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final SeatRepository seatRepository;
    private final ShowSeatRepository showSeatRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = RedisCacheConfig.EVENTS_CACHE, key = "#page + '-' + #size + '-' + #category + '-' + #city + '-' + #search", unless = "#result.empty")
    public Page<EventResponse> getEvents(int page, int size, String category, String city, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").ascending());
        Page<Event> eventPage = eventRepository.findByFilters(
                (category != null && !category.isBlank()) ? category : null,
                (city != null && !city.isBlank()) ? city : null,
                (search != null && !search.isBlank()) ? search : null,
                pageable
        );

        return eventPage.map(this::mapToEventResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = RedisCacheConfig.EVENT_DETAILS_CACHE, key = "#id")
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findByIdWithVenue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        return mapToEventResponse(event);
    }

    @Transactional(readOnly = true)
    public SeatMapResponse getEventSeatMap(Long eventId) {
        Event event = eventRepository.findByIdWithVenue(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        List<ShowSeat> showSeats = showSeatRepository.findByEventIdWithSeat(eventId);

        List<ShowSeatResponse> seatResponses = showSeats.stream()
                .map(this::mapToShowSeatResponse)
                .collect(Collectors.toList());

        Map<String, List<ShowSeatResponse>> seatsByTier = seatResponses.stream()
                .collect(Collectors.groupingBy(s -> s.getSeatTier().name()));

        int total = showSeats.size();
        int available = (int) showSeats.stream().filter(s -> s.getStatus() == SeatStatus.AVAILABLE).count();
        int locked = (int) showSeats.stream().filter(s -> s.getStatus() == SeatStatus.LOCKED).count();
        int booked = (int) showSeats.stream().filter(s -> s.getStatus() == SeatStatus.BOOKED).count();

        return SeatMapResponse.builder()
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .venue(mapToVenueResponse(event.getVenue()))
                .totalSeats(total)
                .availableSeats(available)
                .lockedSeats(locked)
                .bookedSeats(booked)
                .seats(seatResponses)
                .seatsByTier(seatsByTier)
                .build();
    }

    @Transactional
    @CacheEvict(value = {RedisCacheConfig.EVENTS_CACHE, RedisCacheConfig.EVENT_DETAILS_CACHE}, allEntries = true)
    public EventResponse createEvent(EventCreateRequest request) {
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue", "id", request.getVenueId()));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory().toUpperCase())
                .venue(venue)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .bannerUrl(request.getBannerUrl())
                .build();

        Event savedEvent = eventRepository.save(event);

        // Populate ShowSeats from venue seats
        List<Seat> venueSeats = seatRepository.findByVenueIdOrderBySeatNumberAsc(venue.getId());
        List<ShowSeat> showSeats = new ArrayList<>();

        for (Seat seat : venueSeats) {
            BigDecimal price = seat.getBasePrice();
            if (seat.getSeatTier() == SeatTier.VIP && request.getVipPrice() != null) {
                price = request.getVipPrice();
            } else if (seat.getSeatTier() == SeatTier.PREMIUM && request.getPremiumPrice() != null) {
                price = request.getPremiumPrice();
            } else if (seat.getSeatTier() == SeatTier.STANDARD && request.getStandardPrice() != null) {
                price = request.getStandardPrice();
            }

            ShowSeat showSeat = ShowSeat.builder()
                    .event(savedEvent)
                    .seat(seat)
                    .status(SeatStatus.AVAILABLE)
                    .price(price)
                    .build();
            showSeats.add(showSeat);
        }

        showSeatRepository.saveAll(showSeats);
        log.info("Created new event '{}' with {} show seats at venue '{}'", savedEvent.getTitle(), showSeats.size(), venue.getName());

        return mapToEventResponse(savedEvent);
    }

    @Transactional
    @CacheEvict(value = {RedisCacheConfig.EVENTS_CACHE, RedisCacheConfig.EVENT_DETAILS_CACHE}, allEntries = true)
    public EventResponse updateEvent(Long id, EventCreateRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory().toUpperCase());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        if (request.getBannerUrl() != null) {
            event.setBannerUrl(request.getBannerUrl());
        }

        Event updated = eventRepository.save(event);
        log.info("Updated event id: {}", id);
        return mapToEventResponse(updated);
    }

    @Transactional
    public VenueResponse createVenue(VenueCreateRequest request) {
        int totalCapacity = (request.getVipRows() * request.getVipSeatsPerRow()) +
                (request.getPremiumRows() * request.getPremiumSeatsPerRow()) +
                (request.getStandardRows() * request.getStandardSeatsPerRow());

        Venue venue = Venue.builder()
                .name(request.getName())
                .city(request.getCity())
                .address(request.getAddress())
                .totalCapacity(totalCapacity)
                .build();

        Venue savedVenue = venueRepository.save(venue);

        List<Seat> seats = new ArrayList<>();

        // Generate VIP Seats (Rows A, B, etc.)
        char rowChar = 'A';
        for (int r = 0; r < request.getVipRows(); r++) {
            for (int s = 1; s <= request.getVipSeatsPerRow(); s++) {
                seats.add(Seat.builder()
                        .venue(savedVenue)
                        .seatNumber(rowChar + "" + s)
                        .seatTier(SeatTier.VIP)
                        .basePrice(request.getVipBasePrice() != null ? request.getVipBasePrice() : BigDecimal.valueOf(150.00))
                        .build());
            }
            rowChar++;
        }

        // Generate Premium Seats
        for (int r = 0; r < request.getPremiumRows(); r++) {
            for (int s = 1; s <= request.getPremiumSeatsPerRow(); s++) {
                seats.add(Seat.builder()
                        .venue(savedVenue)
                        .seatNumber(rowChar + "" + s)
                        .seatTier(SeatTier.PREMIUM)
                        .basePrice(request.getPremiumBasePrice() != null ? request.getPremiumBasePrice() : BigDecimal.valueOf(90.00))
                        .build());
            }
            rowChar++;
        }

        // Generate Standard Seats
        for (int r = 0; r < request.getStandardRows(); r++) {
            for (int s = 1; s <= request.getStandardSeatsPerRow(); s++) {
                seats.add(Seat.builder()
                        .venue(savedVenue)
                        .seatNumber(rowChar + "" + s)
                        .seatTier(SeatTier.STANDARD)
                        .basePrice(request.getStandardBasePrice() != null ? request.getStandardBasePrice() : BigDecimal.valueOf(45.00))
                        .build());
            }
            rowChar++;
        }

        seatRepository.saveAll(seats);
        log.info("Created venue '{}' in '{}' with {} configured seats", savedVenue.getName(), savedVenue.getCity(), seats.size());

        return mapToVenueResponse(savedVenue);
    }

    @Transactional(readOnly = true)
    public List<VenueResponse> getAllVenues() {
        return venueRepository.findAll().stream()
                .map(this::mapToVenueResponse)
                .collect(Collectors.toList());
    }

    public EventResponse mapToEventResponse(Event event) {
        List<ShowSeat> showSeats = showSeatRepository.findByEventIdWithSeat(event.getId());

        BigDecimal minPrice = showSeats.stream()
                .map(ShowSeat::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        BigDecimal maxPrice = showSeats.stream()
                .map(ShowSeat::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        int total = showSeats.size();
        int available = (int) showSeats.stream()
                .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
                .count();

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .venue(mapToVenueResponse(event.getVenue()))
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .bannerUrl(event.getBannerUrl())
                .createdAt(event.getCreatedAt())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .totalSeats(total)
                .availableSeats(available)
                .build();
    }

    public VenueResponse mapToVenueResponse(Venue venue) {
        if (venue == null) return null;
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .city(venue.getCity())
                .address(venue.getAddress())
                .totalCapacity(venue.getTotalCapacity())
                .build();
    }

    public ShowSeatResponse mapToShowSeatResponse(ShowSeat showSeat) {
        return ShowSeatResponse.builder()
                .id(showSeat.getId())
                .seatId(showSeat.getSeat().getId())
                .seatNumber(showSeat.getSeat().getSeatNumber())
                .seatTier(showSeat.getSeat().getSeatTier())
                .status(showSeat.getStatus())
                .price(showSeat.getPrice())
                .lockedByUserId(showSeat.getLockedByUserId())
                .lockExpirationTime(showSeat.getLockExpirationTime())
                .build();
    }
}
