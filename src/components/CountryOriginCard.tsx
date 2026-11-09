/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CountryOriginResult } from '../utils/country';
import { Globe, MapPin, CheckCircle2, ShieldCheck, Clock, Compass, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CountryOriginCardProps {
  country: CountryOriginResult;
  isIndonesia: boolean;
}

export const CountryOriginCard: React.FC<CountryOriginCardProps> = ({
  country,
  isIndonesia,
}) => {
  const getConfidenceBadgeColor = () => {
    switch (country.confidenceLabel) {
      case 'Sangat Tinggi':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Tinggi':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Sedang':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-950 to-blue-950 border border-cyan-800/60 text-cyan-400 shadow-md">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{isIndonesia ? 'Negara Asal Video (Country of Origin)' : 'Video Country of Origin'}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getConfidenceBadgeColor()}`}>
                {country.confidenceLabel} ({country.confidence}%)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isIndonesia
                ? 'Deteksi asal negara kreator & server berdasarkan multi-faktor URL, domain, bahasa, dan routing'
                : 'Account & server origin based on multi-factor domain, linguistic cues, and CDN routing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-950 text-slate-200 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{country.continent}</span>
          </span>
        </div>
      </div>

      {/* Main Country Highlight Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Big Flag & Country Name */}
        <div className="md:col-span-5 bg-slate-950/80 rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="text-4xl sm:text-5xl select-none"
                role="img"
                aria-label={country.countryName}
              >
                {country.flagEmoji}
              </motion.span>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  {isIndonesia ? 'Negara Terdeteksi' : 'Detected Country'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  {country.countryName}
                </h4>
                <span className="text-xs text-cyan-400 font-mono font-bold">
                  Kode ISO: {country.countryCode}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px]">Ibu Kota:</span>
                <span className="text-slate-200 font-semibold">{country.capital}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Benua / Wilayah:</span>
                <span className="text-slate-200 font-semibold">{country.continent}</span>
              </div>
            </div>
          </div>

          {/* Local Upload Time in Origin Country */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {isIndonesia ? 'Waktu Lokal di Negara Asal:' : 'Local Time in Origin Country:'}
            </span>
            <p className="font-mono text-base font-extrabold text-white">
              {country.localUploadTime}
            </p>
            <span className="text-[10px] text-slate-400">
              {isIndonesia
                ? `Standar zona waktu: ${country.standardTimezone}`
                : `Official timezone standard: ${country.standardTimezone}`}
            </span>
          </div>
        </div>

        {/* Right Column: Evidence & Indicators Detected */}
        <div className="md:col-span-7 bg-slate-950/80 rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {isIndonesia ? 'Faktor & Bukti yang Dideteksi Sistem:' : 'Detected Evidence & Indicators:'}
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold">
                Skor Akurasi: {country.confidence}%
              </span>
            </div>

            {/* Confidence bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${country.confidence}%` }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full"
              />
            </div>

            {/* Evidence items */}
            <ul className="space-y-2 text-xs">
              {country.evidenceList.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + idx * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex items-start gap-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {isIndonesia
                ? 'Sistem memvalidasi domain rute shortlink TikTok, metadata bahasa caption, hashtag lokal, dan clustering IP CDN.'
                : 'System correlates TikTok shortlink domains, linguistic tokens, local tags, and CDN machine clusters.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
