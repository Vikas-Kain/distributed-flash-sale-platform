import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string | Date;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onExpire }) => {
  const calculateTimeLeft = () => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;
    return Math.max(0, Math.floor(difference / 1000));
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isLow = timeLeft < 120 && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono text-sm font-bold transition-colors ${
        isExpired
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          : isLow
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
          : 'bg-brand-500/15 text-brand-300 border-brand-500/30'
      }`}
    >
      {isLow || isExpired ? (
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      ) : (
        <Timer className="w-4 h-4 text-brand-400" />
      )}
      <span>
        {isExpired
          ? 'Reservation Expired'
          : `Reserved for: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>
    </div>
  );
};
