import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event, SeatMapResponse, ShowSeat } from '../types';
import { eventService } from '../services/eventService';
import { SeatMap } from '../components/SeatMap';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Ticket, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const fetchEventAndSeats = async (showSpinner = true) => {
    if (!id) return;
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const [eventData, seatData] = await Promise.all([
        eventService.getEventById(id),
        eventService.getSeatMap(id),
      ]);
      setEvent(eventData);
      setSeatMap(seatData);
    } catch (err) {
      console.error('Failed to load event details', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEventAndSeats(true);
    // Real-time polling every 8 seconds for seat status changes
    const interval = setInterval(() => fetchEventAndSeats(false), 8000);
    return () => clearInterval(interval);
  }, [id]);

  const handleToggleSeat = (seat: ShowSeat) => {
    setLockError(null);
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((sId) => sId !== seat.id);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 seats can be reserved in a single transaction.');
          return prev;
        }
        return [...prev, seat.id];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedSeatIds([]);
    setLockError(null);
  };

  const handleLockSeats = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (selectedSeatIds.length === 0 || !id) return;

    setIsLocking(true);
    setLockError(null);

    try {
      const lockRes = await eventService.lockSeats(id, selectedSeatIds);
      // Navigate to checkout with booking ID and lock response payload
      navigate(`/checkout/${lockRes.bookingId}`, {
        state: { lockData: lockRes, eventData: event },
      });
    } catch (err: any) {
      console.error('Lock seats failed', err);
      const errorMessage =
        err.response?.data?.message || 'One or more selected seats were just claimed by another user. Please choose alternative seats.';
      setLockError(errorMessage);
      // Refresh seat map immediately to reflect updated statuses
      fetchEventAndSeats(false);
    } finally {
      setIsLocking(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-6xl mx-auto py-16 space-y-8 animate-pulse">
        <div className="h-64 rounded-3xl bg-slate-900/60" />
        <div className="h-96 rounded-3xl bg-slate-900/40" />
      </div>
    );
  }

  const startDate = new Date(event.startTime);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events Catalog
      </button>

      {/* Event Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/30 text-brand-300 border border-brand-500/40 backdrop-blur-md">
              {event.category}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{event.title}</h1>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">{event.description}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Venue Capacity</span>
                <span className="text-base font-bold text-white">{event.venue?.totalCapacity} Seats</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-700" />
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Available</span>
                <span className="text-base font-bold text-emerald-400">{seatMap?.availableSeats ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-header Meta */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>{formattedDate} • {formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{event.venue?.name}, {event.venue?.address}, {event.venue?.city}</span>
            </div>
          </div>

          <button
            onClick={() => fetchEventAndSeats(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing Map...' : 'Live Map'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Seat Matrix */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">Select Your Preferred Seats</h2>
          <p className="text-xs text-slate-400">
            Click available seats to reserve. Once selected, click 'Lock Seats' to hold them for 10 minutes.
          </p>
        </div>

        {seatMap && (
          <SeatMap
            seats={seatMap.seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            onClearSelection={handleClearSelection}
            onLockSeats={handleLockSeats}
            isLocking={isLocking}
            lockError={lockError}
          />
        )}
      </section>
    </div>
  );
};
