import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Flame, ArrowRight } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const startDate = new Date(event.startTime);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'CONCERT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'TECH':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'SPORTS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'THEATRE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const isLowAvailability = event.availableSeats > 0 && event.availableSeats < 30;

  return (
    <div className="group relative bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-800 hover:border-brand-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col h-full">
      {/* Banner Image */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-800">
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
        </div>

        {/* Live Availability Badge */}
        {isLowAvailability && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-rose-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            Fast Selling
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center text-xs font-semibold text-brand-400 mb-2 gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mb-2">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>
        </div>

        <div>
          {/* Venue Location */}
          <div className="flex items-center text-xs text-slate-400 mb-4 gap-1.5 border-t border-slate-800/80 pt-3">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{event.venue?.name}, {event.venue?.city}</span>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">From</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-white">${event.minPrice ? Number(event.minPrice).toFixed(2) : '49.99'}</span>
              </div>
            </div>

            <Link
              to={`/events/${event.id}`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Reserve Seats</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
