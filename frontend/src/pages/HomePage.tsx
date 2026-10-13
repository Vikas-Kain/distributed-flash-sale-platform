import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { eventService } from '../services/eventService';
import { EventCard } from '../components/EventCard';
import { Search, Filter, Sparkles, Zap, Flame, MapPin, Music, Trophy, Laptop, Theater } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  const categories = [
    { id: '', name: 'All Events', icon: Sparkles },
    { id: 'CONCERT', name: 'Concerts', icon: Music },
    { id: 'TECH', name: 'Tech & AI', icon: Laptop },
    { id: 'SPORTS', name: 'Sports', icon: Trophy },
    { id: 'THEATRE', name: 'Theatre', icon: Theater },
  ];

  const cities = ['All Cities', 'New York', 'London', 'Denver', 'Sydney'];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents({
        category: selectedCategory || undefined,
        city: selectedCity === 'All Cities' ? undefined : selectedCity || undefined,
        search: searchTerm || undefined,
        size: 12,
      });
      setEvents(data.content || []);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedCity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/70 via-slate-900 to-[#090d16] border border-slate-800/80 p-8 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>High-Speed Distributed Flash Sale Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Reserve Premier Seats with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400">
              Zero Latency & No Double-Booking.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Powered by Redisson distributed locks, Kafka event streaming, and sub-millisecond Cache-Aside acceleration. Grab your tickets before the lock expires!
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by artist, concert, match, or venue..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Search Events</span>
            </button>
          </form>
        </div>
      </section>

      {/* Category Pills & Filters */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                    isActive
                      ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-900/50 border border-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
            <Flame className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Events Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
