import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { TicketPass } from '../components/TicketPass';
import { Ticket, Calendar, MapPin, CheckCircle, Clock, XCircle, ArrowRight, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    bookingService
      .getMyBookings()
      .then((data) => setBookings(data))
      .catch((err) => console.error('Failed to load user bookings', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Checkout
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">My Tickets & Bookings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your upcoming events, verified tickets, and order transaction history.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't reserved any event tickets yet. Check out our upcoming concerts, shows, and matches!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20"
          >
            <span>Discover Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const startDate = new Date(b.eventStartTime);
            const dateStr = startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Event Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 hidden sm:block">
                    <img
                      src={b.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=400&q=80'}
                      alt={b.eventTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(b.status)}
                      <span className="text-xs font-mono text-slate-400">#{b.orderReference}</span>
                    </div>

                    <h3 className="text-base font-bold text-white">{b.eventTitle}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        <span>{dateStr} • {timeStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{b.venue?.name}, {b.venue?.city}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 font-semibold">Seats:</span>
                      <div className="flex flex-wrap gap-1">
                        {b.seats?.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200"
                          >
                            {s.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
                    <span className="text-lg font-black text-white">${Number(b.totalAmount).toFixed(2)}</span>
                  </div>

                  {b.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-400" />
                      <span>View Pass</span>
                    </button>
                  ) : b.status === 'PENDING' ? (
                    <Link
                      to={`/checkout/${b.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                    >
                      <span>Complete Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <TicketPass booking={selectedBooking} />
          </div>
        </div>
      )}
    </div>
  );
};
