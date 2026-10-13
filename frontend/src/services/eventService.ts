import api from './api';
import { Event, PageResponse, SeatMapResponse, SeatLockRequest, SeatLockResponse } from '../types';

export const eventService = {
  async getEvents(params?: {
    page?: number;
    size?: number;
    category?: string;
    city?: string;
    search?: string;
  }): Promise<PageResponse<Event>> {
    const response = await api.get<PageResponse<Event>>('/events', { params });
    return response.data;
  },

  async getEventById(id: number | string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async getSeatMap(eventId: number | string): Promise<SeatMapResponse> {
    const response = await api.get<SeatMapResponse>(`/events/${eventId}/seat-map`);
    return response.data;
  },

  async lockSeats(eventId: number | string, seatIds: number[]): Promise<SeatLockResponse> {
    const response = await api.post<SeatLockResponse>(`/events/${eventId}/seats/lock`, {
      seatIds,
    } as SeatLockRequest);
    return response.data;
  },
};
