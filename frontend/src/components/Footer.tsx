import React from 'react';
import { Ticket, ShieldCheck, Zap, Database, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060910] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center">
                <Ticket className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <span className="text-lg font-black text-white">Pulse<span className="text-brand-400">Pass</span></span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise distributed ticketing engine with Redisson fair locks, Apache Kafka messaging, and PostgreSQL high-availability clustering.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Architecture</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Redisson Fair Lock Engine
            </li>
            <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Apache Kafka KRaft Stream
            </li>
            <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Database className="w-3.5 h-3.5 text-brand-400" /> PostgreSQL 16 + Cache-Aside
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Guarantees</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Double-Booking
            </li>
            <li className="text-slate-400">10-Minute Lock Hold Windows</li>
            <li className="text-slate-400">SHA-256 Digital Verification</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Platform Demo</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Admin Account: <span className="text-amber-400 font-mono">admin@platform.com</span> / <span className="text-slate-300 font-mono">admin123</span><br />
            Customer: <span className="text-brand-300 font-mono">customer@platform.com</span> / <span className="text-slate-300 font-mono">customer123</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 PulsePass Platform. Built with Spring Boot 3 & React.</p>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Operational
          </span>
        </div>
      </div>
    </footer>
  );
};
