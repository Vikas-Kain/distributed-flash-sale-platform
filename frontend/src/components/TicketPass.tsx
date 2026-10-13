import React from 'react';
import { Booking } from '../types';
import { Calendar, MapPin, Ticket, ShieldCheck, Download, Printer, CheckCircle } from 'lucide-react';

interface TicketPassProps {
  booking: Booking;
}

export const TicketPass: React.FC<TicketPassProps> = ({ booking }) => {
  const startDate = new Date(booking.eventStartTime);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMockPdf = () => {
    const textContent = `
=====================================================
PULSEPASS DIGITAL E-TICKET CONFIRMATION
=====================================================
Order Reference: ${booking.orderReference}
Verification Hash: ${booking.verificationHash || 'SHA-SECURE-2026'}
Event:           ${booking.eventTitle} (${booking.eventCategory})
Venue:           ${booking.venue?.name}, ${booking.venue?.city}
Address:         ${booking.venue?.address}
Date & Time:     ${formattedDate} at ${formattedTime}
Customer:        ${booking.userName} (${booking.userEmail})
Seats Reserved:  ${booking.seats?.map((s) => `${s.seatNumber} [${s.seatTier}]`).join(', ')}
Total Paid:      $${Number(booking.totalAmount).toFixed(2)}
Status:          ${booking.status}
Payment Ref:     ${booking.payment?.paymentReference || 'N/A'}
=====================================================
Admit One per Seat. Present this barcode/QR at entry.
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${booking.orderReference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Pass
        </button>
        <button
          onClick={handleDownloadMockPdf}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Download E-Ticket
        </button>
      </div>

      {/* Ticket Container */}
      <div className="bg-slate-900 rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl relative">
        {/* Top Header Card */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-950">
          <img
            src={booking.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'}
            alt={booking.eventTitle}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          <div className="absolute top-4 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-300 border border-brand-500/40">
                {booking.eventCategory}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {booking.status}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-300 font-bold">#{booking.orderReference}</span>
          </div>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{booking.eventTitle}</h2>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Date & Time
              </span>
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-slate-400 text-[11px] block ml-6">{formattedTime}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Venue Location
              </span>
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{booking.venue?.name}</span>
              </div>
              <span className="text-slate-400 text-[11px] block ml-6">{booking.venue?.address}</span>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
              Reserved Seats ({booking.seats?.length || 0})
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.seats?.map((seat) => (
                <div
                  key={seat.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-white shadow-inner"
                >
                  <Ticket className="w-3.5 h-3.5 text-brand-400" />
                  <span>Seat {seat.seatNumber}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-normal">
                    {seat.seatTier}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Perforation Cut line */}
          <div className="relative py-2 flex items-center justify-between">
            <div className="w-5 h-8 -ml-8 bg-[#090d16] rounded-r-full border-r border-t border-b border-slate-700/80" />
            <div className="flex-1 border-b-2 border-dashed border-slate-700 mx-3" />
            <div className="w-5 h-8 -mr-8 bg-[#090d16] rounded-l-full border-l border-t border-b border-slate-700/80" />
          </div>

          {/* Verification Barcode & QR Simulation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="flex items-center gap-4">
              {/* Simulated QR Code */}
              <div className="w-20 h-20 bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-lg">
                <div className="w-full h-full border-2 border-slate-900 grid grid-cols-5 gap-0.5 p-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${(i * 7) % 3 === 0 || i % 4 === 0 ? 'bg-slate-900' : 'bg-transparent'} rounded-[1px]`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Digital Verification
                </span>
                <p className="font-mono text-xs font-bold text-cyan-300 break-all">
                  {booking.verificationHash || 'VERIFIED-TOKEN-9281'}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authentic Ticket Pass</span>
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Amount Paid</span>
              <span className="text-2xl font-black text-white">${Number(booking.totalAmount).toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {booking.payment?.paymentMethod || 'SECURE_GATEWAY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
