/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimeOfDayInfo, PrimeTimeAnalysis } from '../utils/tiktok';
import { Moon, Sunrise, Sun, Sunset, Sparkles, Flame, Zap, AlertCircle } from 'lucide-react';

interface PrimeTimeBadgeProps {
  timeOfDay: TimeOfDayInfo;
  primeTime: PrimeTimeAnalysis;
  hour: number;
  isIndonesia: boolean;
}

export const PrimeTimeBadge: React.FC<PrimeTimeBadgeProps> = ({
  timeOfDay,
  primeTime,
  hour,
  isIndonesia,
}) => {
  const getIcon = () => {
    switch (timeOfDay.icon) {
      case 'Moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'Sunrise':
        return <Sunrise className="w-5 h-5 text-amber-400" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'Sunset':
        return <Sunset className="w-5 h-5 text-orange-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-rose-400" />;
    }
  };

  const getRatingBadge = () => {
    switch (primeTime.rating) {
      case 'SUPER PRIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40">
            <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
            {primeTime.badge}
          </span>
        );
      case 'PRIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Zap className="w-4 h-4 text-blue-400" />
            {primeTime.badge}
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            {primeTime.badge}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Moon className="w-4 h-4 text-slate-400" />
            {primeTime.badge}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              {getIcon()}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {isIndonesia ? 'Slot Waktu Unggah' : 'Upload Time Slot'}
              </span>
              <h4 className="text-base font-bold text-slate-100">
                {timeOfDay.periodName} ({String(hour).padStart(2, '0')}:00)
              </h4>
            </div>
          </div>

          <div>{getRatingBadge()}</div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {timeOfDay.description}
        </p>
      </div>

      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-semibold text-slate-200">
            {isIndonesia ? 'Analisis Algoritma TikTok:' : 'Algorithm Insight:'}{' '}
          </span>
          <span className="text-slate-400">{primeTime.advice}</span>
        </div>
      </div>
    </div>
  );
};
