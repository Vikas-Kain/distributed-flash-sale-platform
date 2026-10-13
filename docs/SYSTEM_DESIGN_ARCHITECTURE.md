# 🏛️ Distributed Systems Design & Technical Deep-Dive

This document provides the architectural rationale, concurrency models, and interview preparation defense points for **PulsePass**.

---

## 1. Concurrency Control: Why Redisson Fair Locks?

### The Problem
During a flash sale, tens of thousands of requests hit the reservation endpoint for the exact same seat within a few milliseconds.
If we relied solely on database transactions:
1. `SELECT ... FOR UPDATE` (Pessimistic locking) leads to severe database thread pool starvation, high lock acquisition wait times, deadlocks, and cascading timeouts across the connection pool (HikariCP).
2. Pure Optimistic Locking (`@Version`) without a distributed lock results in massive transaction rollbacks (e.g., 9,999 rollbacks for 10,000 requests), burning database CPU and causing excessive network roundtrips.

### The Solution: Two-Tier Defense
We implement a **Two-Tier Concurrency Architecture**:
1. **Tier 1 (Distributed Fair Lock in Redis)**:
   - Evaluated at the API layer *before* touching the database transaction.
   - We use Redisson's Fair Lock implementation (`RLock fairLock = redissonClient.getFairLock("lock:event:1:seat:5")`).
   - Fair locks maintain an orderly FIFO queue across distributed JVM instances using Redis sorted sets and pub/sub channels.
   - Fast failover: Requests that cannot acquire the lock within 3 seconds fail fast with `409 Conflict`, shielding PostgreSQL from catastrophic load.
2. **Tier 2 (JPA `@Version` Concurrency Defense)**:
   - At the persistence layer, the `ShowSeat` entity has an integer/timestamp `@Version` column.
   - If Redis were to experience an unexpected split-brain or network partition, the second request would attempt to update `ShowSeat` with an outdated version, causing Hibernate to throw `OptimisticLockException` and abort the transaction.

---

## 2. Deadlock Avoidance: Resource Hierarchy Sorting

### The Problem
When a customer attempts to book multiple seats at once (e.g., Customer A wants seats `[12, 45]`, Customer B wants seats `[45, 12]`):
- Thread 1 locks Seat 12, tries to lock Seat 45.
- Thread 2 locks Seat 45, tries to lock Seat 12.
- Classic circular wait condition (Dining Philosophers distributed deadlock).

### The Solution
In `SeatLockService.java`:
```java
List<Long> sortedSeatIds = new ArrayList<>(seatIds);
Collections.sort(sortedSeatIds);
```
By enforcing strict ascending resource acquisition order across all threads in the distributed system, circular wait is mathematically impossible.

---

## 3. High-Throughput Event Catalog: Cache-Aside Strategy

- Read throughput on popular event detail pages is 100x higher than write throughput.
- We utilize Spring Cache with Redis (`@Cacheable(value = "event_details", key = "#eventId")`).
- Sub-millisecond reads are served directly from Redis memory.
- Writes or seat reservations invoke `@CacheEvict` to maintain cache coherence.

---

## 4. Asynchronous Fulfillment: Kafka Event-Driven Pipeline

### Why Decouple with Kafka?
Checkout operations require several ancillary tasks:
1. Generating a PDF digital ticket.
2. Computing a SHA-256 cryptographic ticket checksum.
3. Sending an email confirmation and customer receipt.

If done synchronously during the HTTP checkout request:
- HTTP latency spikes from ~40ms to ~1200ms.
- Any intermittent SMTP timeout fails the customer's payment transaction!

### With Kafka:
- The customer checkout HTTP request only transitions the booking to `CONFIRMED` in the DB and pushes an `OrderPlacedEvent` to the Kafka topic `ticket-orders-topic`.
- The HTTP response returns `200 OK` in < 50ms.
- `KafkaOrderListener` processes the event asynchronously, generates the ticket checksum, and dispatches the email. If the consumer fails, Kafka's consumer group offset retry mechanism handles retries with zero loss of order data.

---

## 5. Key Interview Questions & Defenses

| Interview Question | Engineered Defense |
|---|---|
| **"Why not use Redis Lua scripts instead of Redisson?"** | A Lua script executes atomically on single Redis keys, but Redisson Fair Locks provide distributed FIFO queue semantics, automatic lock lease renewal (Watchdog), and cleaner object abstraction for multi-seat acquisitions. |
| **"What happens if a user locks a seat and closes their laptop?"** | Each lock has a 10-minute lease TTL. Additionally, the backend runs a scheduled reconciler (`ExpiredSeatReleaseScheduler`) every 30 seconds that queries for `LOCKED` seats where `lockedAt + 10 mins < now()`, releasing both the Redis lock and resetting the DB seat status to `AVAILABLE`. |
| **"How do you prevent duplicate message processing in Kafka?"** | The consumer records processed `orderId` states idempotently in the database. If an offset rebalance replays a message, the consumer checks if the ticket pass is already generated and skips reprocessing. |
