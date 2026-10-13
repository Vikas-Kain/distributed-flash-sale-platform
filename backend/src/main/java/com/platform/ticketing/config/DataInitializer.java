package com.platform.ticketing.config;

import com.platform.ticketing.dto.request.EventCreateRequest;
import com.platform.ticketing.dto.request.VenueCreateRequest;
import com.platform.ticketing.dto.response.VenueResponse;
import com.platform.ticketing.entity.User;
import com.platform.ticketing.entity.enums.Role;
import com.platform.ticketing.repository.UserRepository;
import com.platform.ticketing.repository.VenueRepository;
import com.platform.ticketing.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final EventService eventService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initialization.");
            return;
        }

        log.info("Initializing demo users, venues, events, and tiered seat matrices...");

        // 1. Seed Users
        User admin = User.builder()
                .name("Platform Admin")
                .email("admin@platform.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ROLE_ADMIN)
                .build();
        userRepository.save(admin);

        User customer = User.builder()
                .name("Alex Johnson")
                .email("customer@platform.com")
                .password(passwordEncoder.encode("customer123"))
                .role(Role.ROLE_CUSTOMER)
                .build();
        userRepository.save(customer);

        User demoUser = User.builder()
                .name("Sarah Connor")
                .email("sarah@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_CUSTOMER)
                .build();
        userRepository.save(demoUser);

        // 2. Seed Venues
        VenueResponse msg = eventService.createVenue(VenueCreateRequest.builder()
                .name("Madison Square Garden")
                .city("New York")
                .address("4 Pennsylvania Plaza, New York, NY 10001")
                .vipRows(2)
                .vipSeatsPerRow(10)
                .vipBasePrice(BigDecimal.valueOf(199.99))
                .premiumRows(3)
                .premiumSeatsPerRow(10)
                .premiumBasePrice(BigDecimal.valueOf(129.99))
                .standardRows(4)
                .standardSeatsPerRow(10)
                .standardBasePrice(BigDecimal.valueOf(69.99))
                .build());

        VenueResponse o2 = eventService.createVenue(VenueCreateRequest.builder()
                .name("The O2 Arena")
                .city("London")
                .address("Peninsula Square, London SE10 0DX")
                .vipRows(2)
                .vipSeatsPerRow(8)
                .vipBasePrice(BigDecimal.valueOf(180.00))
                .premiumRows(3)
                .premiumSeatsPerRow(8)
                .premiumBasePrice(BigDecimal.valueOf(110.00))
                .standardRows(4)
                .standardSeatsPerRow(8)
                .standardBasePrice(BigDecimal.valueOf(55.00))
                .build());

        VenueResponse redRocks = eventService.createVenue(VenueCreateRequest.builder()
                .name("Red Rocks Amphitheatre")
                .city("Denver")
                .address("18300 W Alameda Pkwy, Morrison, CO 80465")
                .vipRows(2)
                .vipSeatsPerRow(10)
                .vipBasePrice(BigDecimal.valueOf(220.00))
                .premiumRows(3)
                .premiumSeatsPerRow(10)
                .premiumBasePrice(BigDecimal.valueOf(140.00))
                .standardRows(3)
                .standardSeatsPerRow(10)
                .standardBasePrice(BigDecimal.valueOf(75.00))
                .build());

        VenueResponse operaHouse = eventService.createVenue(VenueCreateRequest.builder()
                .name("Sydney Opera House")
                .city("Sydney")
                .address("Bennelong Point, Sydney NSW 2000")
                .vipRows(2)
                .vipSeatsPerRow(8)
                .vipBasePrice(BigDecimal.valueOf(250.00))
                .premiumRows(2)
                .premiumSeatsPerRow(8)
                .premiumBasePrice(BigDecimal.valueOf(160.00))
                .standardRows(3)
                .standardSeatsPerRow(8)
                .standardBasePrice(BigDecimal.valueOf(85.00))
                .build());

        // 3. Seed Events
        eventService.createEvent(EventCreateRequest.builder()
                .title("The Neon Odyssey World Tour - Coldplay")
                .description("Experience an electrifying stadium spectacle featuring jaw-dropping laser displays, kinetic dance stages, and timeless anthems in an unforgettable night.")
                .category("CONCERT")
                .venueId(msg.getId())
                .startTime(LocalDateTime.now().plusDays(5).withHour(19).withMinute(30))
                .endTime(LocalDateTime.now().plusDays(5).withHour(23).withMinute(0))
                .bannerUrl("https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80")
                .vipPrice(BigDecimal.valueOf(249.99))
                .premiumPrice(BigDecimal.valueOf(149.99))
                .standardPrice(BigDecimal.valueOf(79.99))
                .build());

        eventService.createEvent(EventCreateRequest.builder()
                .title("CyberTech Global Summit 2026")
                .description("The premier global gathering of AI architects, cloud titans, and cybersecurity leaders showcasing breakthrough distributed systems and next-gen infrastructure.")
                .category("TECH")
                .venueId(o2.getId())
                .startTime(LocalDateTime.now().plusDays(12).withHour(9).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(14).withHour(18).withMinute(0))
                .bannerUrl("https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80")
                .vipPrice(BigDecimal.valueOf(399.00))
                .premiumPrice(BigDecimal.valueOf(249.00))
                .standardPrice(BigDecimal.valueOf(129.00))
                .build());

        eventService.createEvent(EventCreateRequest.builder()
                .title("NBA Championship Showcase: Celtics vs Lakers")
                .description("A high-octane rivalry clash featuring franchise superstars fighting for prime conference standings in front of a sold-out arena.")
                .category("SPORTS")
                .venueId(msg.getId())
                .startTime(LocalDateTime.now().plusDays(8).withHour(20).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(8).withHour(23).withMinute(0))
                .bannerUrl("https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80")
                .vipPrice(BigDecimal.valueOf(299.99))
                .premiumPrice(BigDecimal.valueOf(189.99))
                .standardPrice(BigDecimal.valueOf(99.99))
                .build());

        eventService.createEvent(EventCreateRequest.builder()
                .title("The Phantom of the Opera - Grand Revival")
                .description("Andrew Lloyd Webber's timeless masterpiece reimagined with a 60-piece philharmonic orchestra, opulent costumes, and breathtaking stage effects.")
                .category("THEATRE")
                .venueId(operaHouse.getId())
                .startTime(LocalDateTime.now().plusDays(15).withHour(19).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(15).withHour(22).withMinute(30))
                .bannerUrl("https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80")
                .vipPrice(BigDecimal.valueOf(280.00))
                .premiumPrice(BigDecimal.valueOf(175.00))
                .standardPrice(BigDecimal.valueOf(95.00))
                .build());

        eventService.createEvent(EventCreateRequest.builder()
                .title("Electronic Pulse Music Festival")
                .description("Underneath the Colorado stars, world-renowned DJs unleash state-of-the-art bass music, spatial acoustics, and high-frequency synth wave sets.")
                .category("CONCERT")
                .venueId(redRocks.getId())
                .startTime(LocalDateTime.now().plusDays(20).withHour(18).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(21).withHour(2).withMinute(0))
                .bannerUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80")
                .vipPrice(BigDecimal.valueOf(260.00))
                .premiumPrice(BigDecimal.valueOf(160.00))
                .standardPrice(BigDecimal.valueOf(89.00))
                .build());

        log.info("Platform database initialized with 4 venues and 5 diverse flagship events.");
    }
}
