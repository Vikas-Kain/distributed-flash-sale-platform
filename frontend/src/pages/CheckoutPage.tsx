import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Booking, SeatLockResponse, Event } from '../types';
import { bookingService } from '../services/bookingService';
import { CountdownTimer } from '../components/CountdownTimer';
import { ShieldCheck, CreditCard, Lock, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Ticket } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const lockData = location.state?.lockData as SeatLockResponse | undefined;
  const eventData = location.state?.eventData as Event | undefined;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');

  // Form mock card state
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState<string>('09/28');
  const [cardCvv, setCardCvv] = useState<string>('773');

  useEffect(() => {
    if (!orderId) return;

    bookingService
      .getBookingById(orderId)
      .then((data) => {
        setBooking(data);
        if (data.status === 'CONFIRMED') {
          navigate(`/order-success/${data.id}`, { replace: true });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch booking', err);
        setError('Could not retrieve booking details. It may have expired.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleExpired = () => {
    setError('Your 10-minute seat reservation has expired. Please return to the event page to choose seats again.');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setProcessing(true);
    setError(null);

    try {
      const totalAmount = booking?.totalAmount || lockData?.totalAmount || 0;
      const feeTotal = Number(totalAmount) * 0.08 + 2.5; // service fees
      const finalAmount = Number(totalAmount) + feeTotal;

      const confirmedBooking = await bookingService.checkout(orderId, {
        paymentMethod,
        amount: Number(finalAmount.toFixed(2)),
        cardNumber,
        cardExpiry,
        cardCvv,
      });

      navigate(`/order-success/${confirmedBooking.id}`, {
        state: { confirmedBooking },
      });
    } catch (err: any) {
      console.error('Checkout failed', err);
      const msg = err.response?.data?.message || 'Payment processing failed. Please check details and try again.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-900/60" />
        <div className="h-80 rounded-2xl bg-slate-900/40" />
      </div>
    );
  }

  const basePrice = booking?.totalAmount || lockData?.totalAmount || 0;
  const serviceFee = Number(basePrice) * 0.08;
  const facilityFee = 2.5;
  const grandTotal = Number(basePrice) + serviceFee + facilityFee;
  const expirationTime = booking?.expiresAt || lockData?.lockExpirationTime || new Date(Date.now() + 600000).toISOString();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner & Countdown Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass border border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel & Return
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">Hold Lock Expiration:</span>
          <CountdownTimer targetDate={expirationTime} onExpire={handleExpired} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Checkout Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Payment Form (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Select Payment Method</h2>
              <p className="text-xs text-slate-400">All transactions are encrypted and secured with TLS 1.3.</p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-2 text-brand-400" />
                <div className="text-xs font-bold text-white">Credit / Debit Card</div>
                <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MOCK_INSTANT')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'MOCK_INSTANT'
                    ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-5 h-5 mb-2 text-cyan-400" />
                <div className="text-xs font-bold text-white">Instant Flash Pay</div>
                <div className="text-[10px] text-slate-400">1-Click Fast Settlement</div>
              </button>
            </div>

            {/* Simulated Card Form */}
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-xl shadow-brand-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Confirm & Pay ${grandTotal.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Summary Breakdown (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Summary</h3>

            {/* Event Mini Card */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <span className="text-[10px] font-bold uppercase text-brand-400 block">
                {booking?.eventCategory || eventData?.category || 'EVENT'}
              </span>
              <h4 className="text-sm font-bold text-white line-clamp-2">
                {booking?.eventTitle || eventData?.title || lockData?.eventTitle}
              </h4>
              <p className="text-xs text-slate-400">{booking?.venue?.name || eventData?.venue?.name}</p>
            </div>

            {/* Seats summary */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold text-slate-300 block">Seats Reserved:</span>
              <div className="flex flex-wrap gap-1.5">
                {(booking?.seats || lockData?.lockedSeats || []).map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                  >
                    {s.seatNumber} ({s.seatTier})
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Base Subtotal</span>
                <span className="font-semibold text-white">${Number(basePrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service Fee (8%)</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Venue Facility Charge</span>
                <span>${facilityFee.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-xl font-black text-brand-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Buyer Guarantee & Instant E-Ticket</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
