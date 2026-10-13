import React, { useState, useEffect } from 'react';
import { AnalyticsResponse, Venue, EventCreateRequest, VenueCreateRequest } from '../types';
import { adminService } from '../services/adminService';
import { DollarSign, Ticket, Calendar, TrendingUp, Plus, ShieldAlert, CheckCircle2, Building, RefreshCw, Eye } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'CREATE_EVENT' | 'CREATE_VENUE'>('ANALYTICS');

  // Event Creation Form State
  const [eventForm, setEventForm] = useState<EventCreateRequest>({
    title: '',
    description: '',
    category: 'CONCERT',
    venueId: 1,
    startTime: '',
    endTime: '',
    bannerUrl: '',
    vipPrice: 199.99,
    premiumPrice: 119.99,
    standardPrice: 59.99,
  });

  // Venue Creation Form State
  const [venueForm, setVenueForm] = useState<VenueCreateRequest>({
    name: '',
    city: '',
    address: '',
    vipRows: 2,
    vipSeatsPerRow: 10,
    vipBasePrice: 180,
    premiumRows: 3,
    premiumSeatsPerRow: 10,
    premiumBasePrice: 110,
    standardRows: 4,
    standardSeatsPerRow: 10,
    standardBasePrice: 55,
  });

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, venueList] = await Promise.all([
        adminService.getSalesAnalytics(),
        adminService.getVenues(),
      ]);
      setAnalytics(analyticsData);
      setVenues(venueList);
      if (venueList.length > 0 && !eventForm.venueId) {
        setEventForm((prev) => ({ ...prev, venueId: venueList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess(null);
    setFormError(null);

    try {
      await adminService.createEvent(eventForm);
      setFormSuccess(`Event '${eventForm.title}' created and tiered seats auto-generated successfully!`);
      setEventForm({
        title: '',
        description: '',
        category: 'CONCERT',
        venueId: venues[0]?.id || 1,
        startTime: '',
        endTime: '',
        bannerUrl: '',
        vipPrice: 199.99,
        premiumPrice: 119.99,
        standardPrice: 59.99,
      });
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create event. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess(null);
    setFormError(null);

    try {
      const newVenue = await adminService.createVenue(venueForm);
      setFormSuccess(`Venue '${newVenue.name}' created with ${newVenue.totalCapacity} configured seats!`);
      setVenueForm({
        name: '',
        city: '',
        address: '',
        vipRows: 2,
        vipSeatsPerRow: 10,
        vipBasePrice: 180,
        premiumRows: 3,
        premiumSeatsPerRow: 10,
        premiumBasePrice: 110,
        standardRows: 4,
        standardSeatsPerRow: 10,
        standardBasePrice: 55,
      });
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create venue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-white">Live Platform Analytics & Admin</h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('ANALYTICS');
              setFormSuccess(null);
              setFormError(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ANALYTICS' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('CREATE_EVENT');
              setFormSuccess(null);
              setFormError(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CREATE_EVENT' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Create Event
          </button>
          <button
            onClick={() => {
              setActiveTab('CREATE_VENUE');
              setFormSuccess(null);
              setFormError(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CREATE_VENUE' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            + New Venue
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* VIEW: ANALYTICS OVERVIEW */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ${analytics?.totalRevenue ? Number(analytics.totalRevenue).toFixed(2) : '0.00'}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Settled & confirmed bookings</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Tickets Sold</span>
                <Ticket className="w-4 h-4 text-brand-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics?.totalTicketsSold ?? 0}</div>
              <span className="text-[10px] text-brand-400 font-medium">Confirmed ShowSeats</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Seat Occupancy</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics?.overallOccupancyRate ?? 0}%</div>
              <span className="text-[10px] text-cyan-400 font-medium">Across all venue tiers</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Active Events</span>
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics?.activeEventsCount ?? 0}</div>
              <span className="text-[10px] text-amber-400 font-medium">Live upcoming shows</span>
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Revenue by Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {analytics?.revenueByCategory &&
                Object.entries(analytics.revenueByCategory).map(([cat, rev]) => (
                  <div key={cat} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">{cat}</span>
                    <span className="text-lg font-black text-white">${Number(rev).toFixed(2)}</span>
                    <span className="text-[10px] text-brand-400 block mt-0.5">
                      {analytics.salesByCategory[cat] || 0} tickets
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Orders Stream */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders Feed</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Order Ref</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Event</th>
                    <th className="py-3 px-2">Seats</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics?.recentBookings?.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-2 font-mono text-slate-300 font-semibold">{b.orderReference}</td>
                      <td className="py-3 px-2 text-slate-200">
                        {b.userName}
                        <span className="text-slate-400 block text-[10px]">{b.userEmail}</span>
                      </td>
                      <td className="py-3 px-2 text-white font-medium">{b.eventTitle}</td>
                      <td className="py-3 px-2 text-slate-300">
                        {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </td>
                      <td className="py-3 px-2 font-bold text-white">${Number(b.totalAmount).toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CREATE EVENT FORM */}
      {activeTab === 'CREATE_EVENT' && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2">Create New Flagship Event</h2>
          <p className="text-xs text-slate-400 mb-6">
            Publishes an event and automatically builds tiered show seats for the selected venue layout.
          </p>

          <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
            <div>
              <label className="font-bold uppercase text-slate-400 block mb-1">Event Title</label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="e.g. World Tour Live, AI Summit 2026..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="font-bold uppercase text-slate-400 block mb-1">Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                rows={3}
                placeholder="Detailed event summary..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Category</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="CONCERT">CONCERT</option>
                  <option value="TECH">TECH</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="THEATRE">THEATRE</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Host Venue</label>
                <select
                  value={eventForm.venueId}
                  onChange={(e) => setEventForm({ ...eventForm, venueId: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city} - {v.totalCapacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-slate-400 block mb-1">Banner Image URL</label>
              <input
                type="url"
                value={eventForm.bannerUrl}
                onChange={(e) => setEventForm({ ...eventForm, bannerUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">VIP Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={eventForm.vipPrice}
                  onChange={(e) => setEventForm({ ...eventForm, vipPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Premium Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={eventForm.premiumPrice}
                  onChange={(e) => setEventForm({ ...eventForm, premiumPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Standard Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={eventForm.standardPrice}
                  onChange={(e) => setEventForm({ ...eventForm, standardPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                {submitting ? 'Generating Event & Seats...' : 'Publish Event & Evict Cache'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: CREATE VENUE FORM */}
      {activeTab === 'CREATE_VENUE' && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2">Create New Stadium / Arena Venue</h2>
          <p className="text-xs text-slate-400 mb-6">
            Define seating rows and capacities for VIP, Premium, and Standard tiers.
          </p>

          <form onSubmit={handleCreateVenue} className="space-y-4 text-xs">
            <div>
              <label className="font-bold uppercase text-slate-400 block mb-1">Venue Name</label>
              <input
                type="text"
                value={venueForm.name}
                onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                placeholder="e.g. Staples Center, Royal Albert Hall..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={venueForm.city}
                  onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                  placeholder="e.g. San Francisco"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="font-bold uppercase text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={venueForm.address}
                  onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                  placeholder="e.g. 1111 S Figueroa St"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* VIP Tier Config */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="font-bold text-emerald-400 block">VIP Tier Matrix</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block">VIP Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.vipRows}
                    onChange={(e) => setVenueForm({ ...venueForm, vipRows: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Seats per Row</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.vipSeatsPerRow}
                    onChange={(e) => setVenueForm({ ...venueForm, vipSeatsPerRow: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={venueForm.vipBasePrice}
                    onChange={(e) => setVenueForm({ ...venueForm, vipBasePrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Premium Tier Config */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="font-bold text-cyan-400 block">Premium Tier Matrix</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block">Premium Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.premiumRows}
                    onChange={(e) => setVenueForm({ ...venueForm, premiumRows: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Seats per Row</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.premiumSeatsPerRow}
                    onChange={(e) => setVenueForm({ ...venueForm, premiumSeatsPerRow: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={venueForm.premiumBasePrice}
                    onChange={(e) => setVenueForm({ ...venueForm, premiumBasePrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Standard Tier Config */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="font-bold text-indigo-400 block">Standard Tier Matrix</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block">Standard Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.standardRows}
                    onChange={(e) => setVenueForm({ ...venueForm, standardRows: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Seats per Row</label>
                  <input
                    type="number"
                    min={1}
                    value={venueForm.standardSeatsPerRow}
                    onChange={(e) => setVenueForm({ ...venueForm, standardSeatsPerRow: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={venueForm.standardBasePrice}
                    onChange={(e) => setVenueForm({ ...venueForm, standardBasePrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                {submitting ? 'Constructing Venue Matrix...' : 'Save Venue & Layout'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
