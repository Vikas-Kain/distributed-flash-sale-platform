export type Role = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';
export type SeatTier = 'VIP' | 'PREMIUM' | 'STANDARD';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: User;
}

export interface Venue {
  id: number;
  name: string;
  city: string;
  address: string;
  totalCapacity: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  venue: Venue;
  startTime: string;
  endTime: string;
  bannerUrl: string;
  createdAt: string;
  minPrice: number;
  maxPrice: number;
  totalSeats: number;
  availableSeats: number;
}

export interface ShowSeat {
  id: number;
  seatId: number;
  seatNumber: string;
  seatTier: SeatTier;
  status: SeatStatus;
  price: number;
  lockedByUserId?: number | null;
  lockExpirationTime?: string | null;
}

export interface SeatMapResponse {
  eventId: number;
  eventTitle: string;
  venue: Venue;
  totalSeats: number;
  availableSeats: number;
  lockedSeats: number;
  bookedSeats: number;
  seats: ShowSeat[];
  seatsByTier: Record<string, ShowSeat[]>;
}

export interface SeatLockRequest {
  seatIds: number[];
}

export interface SeatLockResponse {
  bookingId: number;
  orderReference: string;
  reservationToken: string;
  eventId: number;
  eventTitle: string;
  totalAmount: number;
  lockExpirationTime: string;
  expiresInSeconds: number;
  lockedSeats: ShowSeat[];
}

export interface CheckoutRequest {
  paymentMethod: string;
  amount: number;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export interface Payment {
  id: number;
  paymentReference: string;
  paymentMethod: string;
  amount: number;
  status: PaymentStatus;
  processedAt: string;
}

export interface Booking {
  id: number;
  orderReference: string;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventTitle: string;
  eventCategory: string;
  bannerUrl: string;
  eventStartTime: string;
  eventEndTime: string;
  venue: Venue;
  totalAmount: number;
  status: BookingStatus;
  expiresAt: string;
  createdAt: string;
  seats: ShowSeat[];
  payment?: Payment | null;
  verificationHash?: string;
}

export interface AnalyticsResponse {
  totalRevenue: number;
  totalTicketsSold: number;
  totalBookings: number;
  activeEventsCount: number;
  overallOccupancyRate: number;
  revenueByCategory: Record<string, number>;
  salesByCategory: Record<string, number>;
  recentBookings: Booking[];
}

export interface EventCreateRequest {
  title: string;
  description: string;
  category: string;
  venueId: number;
  startTime: string;
  endTime: string;
  bannerUrl: string;
  vipPrice?: number;
  premiumPrice?: number;
  standardPrice?: number;
}

export interface VenueCreateRequest {
  name: string;
  city: string;
  address: string;
  vipRows: number;
  vipSeatsPerRow: number;
  vipBasePrice?: number;
  premiumRows: number;
  premiumSeatsPerRow: number;
  premiumBasePrice?: number;
  standardRows: number;
  standardSeatsPerRow: number;
  standardBasePrice?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}
