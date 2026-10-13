import api from './api';
import { AnalyticsResponse, Event, EventCreateRequest, Venue, VenueCreateRequest } from '../types';

export const adminService = {
  async getSalesAnalytics(): Promise<AnalyticsResponse> {
    const response = await api.get<AnalyticsResponse>('/admin/analytics/sales');
    return response.data;
  },

  async createEvent(data: EventCreateRequest): Promise<Event> {
    const response = await api.post<Event>('/admin/events', data);
    return response.data;
  },

  async updateEvent(id: number | string, data: EventCreateRequest): Promise<Event> {
    const response = await api.put<Event>(`/admin/events/${id}`, data);
    return response.data;
  },

  async createVenue(data: VenueCreateRequest): Promise<Venue> {
    const response = await api.post<Venue>('/admin/venues', data);
    return response.data;
  },

  async getVenues(): Promise<Venue[]> {
    const response = await api.get<Venue[]>('/admin/venues');
    return response.data;
  },
};
