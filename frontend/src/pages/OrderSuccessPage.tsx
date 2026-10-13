import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { TicketPass } from '../components/TicketPass';
import { CheckCircle2, Ticket, ArrowRight, Sparkles } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(
    (location.state?.confirmedBooking as Booking) || null
  );
  const [loading, setLoading] = useState<boolean>(!booking);

  useEffect(() => {
    if (!booking && orderId) {
      bookingService
        .getBookingById(orderId)
        .then((data) => setBooking(data))
        .catch((err) => console.error('Failed to fetch confirmed booking', err))
        .finally(() => setLoading(false));
    }
  }, [orderId, booking]);

  if (loading || !booking) {
    return (
      <div className="max-w-2xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-900/60" />
        <div className="h-96 rounded-2xl bg-slate-900/40" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Hero Badge */}
      <div className="text-center space-y-3 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white">Payment Confirmed!</h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Your order has been processed and your seats are reserved. A confirmation email and digital pass have been issued.
        </p>
      </div>

      {/* Ticket Pass View */}
      <TicketPass booking={booking} />

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/my-bookings"
          className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2"
        >
          <Ticket className="w-4 h-4 text-brand-400" />
          <span>View All My Bookings</span>
        </Link>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
        >
          <span>Explore More Events</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
