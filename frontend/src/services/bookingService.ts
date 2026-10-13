import api from './api';
import { Booking, CheckoutRequest } from '../types';

export const bookingService = {
  async checkout(orderId: number | string, data: CheckoutRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${orderId}/checkout`, data);
    return response.data;
  },

  async getBookingById(id: number | string): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  async getMyBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/users/me/bookings');
    return response.data;
  },
};
