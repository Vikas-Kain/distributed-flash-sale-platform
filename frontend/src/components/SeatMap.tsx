import React, { useState } from 'react';
import { ShowSeat, SeatTier } from '../types';
import { Sparkles, Shield, AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';

interface SeatMapProps {
  seats: ShowSeat[];
  selectedSeatIds: number[];
  onToggleSeat: (seat: ShowSeat) => void;
  onClearSelection: () => void;
  onLockSeats: () => void;
  isLocking: boolean;
  lockError: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  onClearSelection,
  onLockSeats,
  isLocking,
  lockError,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');

  // Group seats by tier
  const vipSeats = seats.filter((s) => s.seatTier === 'VIP');
  const premiumSeats = seats.filter((s) => s.seatTier === 'PREMIUM');
  const standardSeats = seats.filter((s) => s.seatTier === 'STANDARD');

  // Helper to group array of seats by row letter (e.g. 'A', 'B')
  const groupSeatsByRow = (seatList: ShowSeat[]) => {
    const rowMap: Record<string, ShowSeat[]> = {};
    seatList.forEach((s) => {
      const rowLetter = s.seatNumber.charAt(0);
      if (!rowMap[rowLetter]) {
        rowMap[rowLetter] = [];
      }
      rowMap[rowLetter].push(s);
    });
    return Object.entries(rowMap).sort(([a], [b]) => a.localeCompare(b));
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const getSeatColorClass = (seat: ShowSeat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    if (isSelected) {
      return 'bg-brand-500 text-white border-brand-300 ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg shadow-brand-500/50 z-10';
    }

    if (seat.status === 'BOOKED') {
      return 'bg-rose-950/60 text-rose-500/50 border-rose-900/60 cursor-not-allowed opacity-40';
    }

    if (seat.status === 'LOCKED') {
      return 'bg-amber-950/80 text-amber-400 border-amber-600/70 animate-pulse cursor-not-allowed';
    }

    // AVAILABLE
    switch (seat.seatTier) {
      case 'VIP':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 hover:bg-emerald-600 hover:text-white hover:scale-110 shadow-sm';
      case 'PREMIUM':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60 hover:bg-cyan-600 hover:text-white hover:scale-110 shadow-sm';
      case 'STANDARD':
        return 'bg-slate-800/80 text-slate-300 border-slate-600 hover:bg-brand-600 hover:text-white hover:scale-110 shadow-sm';
    }
  };

  const renderTierSection = (title: string, tier: SeatTier, tierSeats: ShowSeat[], badgeColor: string, desc: string) => {
    if (tierSeats.length === 0) return null;
    const rows = groupSeatsByRow(tierSeats);
    const minTierPrice = Math.min(...tierSeats.map((s) => Number(s.price)));

    return (
      <div className="mb-10 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeColor}`}>
              {title}
            </span>
            <span className="text-xs text-slate-400">{desc}</span>
          </div>
          <div className="text-xs text-slate-300 mt-2 sm:mt-0 font-medium">
            Tier Price: <span className="text-sm font-bold text-white">${minTierPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center overflow-x-auto py-2">
          {rows.map(([rowName, rowSeats]) => (
            <div key={rowName} className="flex items-center gap-2">
              <span className="w-6 text-xs font-bold text-slate-500 text-right mr-2">{rowName}</span>
              <div className="flex items-center gap-2">
                {rowSeats.map((seat) => {
                  const isSelectable = seat.status === 'AVAILABLE' || selectedSeatIds.includes(seat.id);
                  const isLocked = seat.status === 'LOCKED';
                  const isBooked = seat.status === 'BOOKED';

                  return (
                    <button
                      key={seat.id}
                      disabled={!isSelectable}
                      onClick={() => onToggleSeat(seat)}
                      title={`Seat ${seat.seatNumber} (${seat.seatTier}) - $${Number(seat.price).toFixed(2)} [${seat.status}]`}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center justify-center ${getSeatColorClass(
                        seat
                      )}`}
                    >
                      {isBooked ? (
                        <X className="w-3.5 h-3.5" />
                      ) : isLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        seat.seatNumber.replace(/^[A-Z]/, '')
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="w-6 text-xs font-bold text-slate-500 text-left ml-2">{rowName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Stage Visual representation */}
      <div className="w-full max-w-2xl mx-auto mb-12 text-center">
        <div className="h-10 bg-gradient-to-b from-brand-500/20 to-transparent rounded-t-[100px] border-t-2 border-cyan-400/80 shadow-[0_-15px_35px_rgba(99,102,241,0.3)] flex items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            ★ STAGE / MAIN SCREEN ★
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-medium">Front of Venue (All Eyes Here)</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-950/70 border border-emerald-500/60" />
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-brand-500 border border-brand-300 shadow-sm" />
          <span className="text-white font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-600 animate-pulse" />
          <span className="text-amber-400">Locked (In-Checkout)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-950/60 border border-rose-900/60 opacity-50" />
          <span className="text-slate-400">Sold Out</span>
        </div>
      </div>

      {/* Seat Sections */}
      <div className="space-y-4">
        {renderTierSection(
          'VIP Front Row Tiers',
          'VIP',
          vipSeats,
          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          'Front rows with pristine acoustics & prime unobstructed vantage'
        )}

        {renderTierSection(
          'Premium Center Tiers',
          'PREMIUM',
          premiumSeats,
          'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          'Optimal viewing angle with elevated stadium seating'
        )}

        {renderTierSection(
          'Standard Tiers',
          'STANDARD',
          standardSeats,
          'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          'Grandstand seating with vibrant full arena immersion'
        )}
      </div>

      {/* Lock Error Alert */}
      {lockError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 my-4">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Reservation Conflict</p>
            <p>{lockError}</p>
          </div>
        </div>
      )}

      {/* Sticky Bottom Floating Selection Bar */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-6 z-40 max-w-4xl mx-auto p-4 rounded-2xl glass border border-brand-500/40 shadow-2xl shadow-brand-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold">
                {selectedSeats.length}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Seats: {selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
                  <button
                    onClick={onClearSelection}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline ml-2"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-slate-400">10-minute fair lock guarantee upon reservation</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total</span>
                <span className="text-2xl font-extrabold text-white">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                disabled={isLocking}
                onClick={onLockSeats}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLocking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Locking Seats...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Lock Seats & Checkout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
