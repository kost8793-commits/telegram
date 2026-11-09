/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FormattedDateTimeResult } from '../utils/tiktok';
import { Calendar, Clock, Check, Copy, Hourglass, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeSpotlightCardProps {
  timeInfo: FormattedDateTimeResult;
  relativeTime: string;
  isIndonesia: boolean;
}

export const TimeSpotlightCard: React.FC<TimeSpotlightCardProps> = ({
  timeInfo,
  relativeTime,
  isIndonesia,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const handleCopyDate = () => {
    const text = `${timeInfo.formattedDate} pukul ${timeInfo.formattedTime} ${timeInfo.timezoneLabel}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/20">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>

      {/* Top Banner / Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {isIndonesia ? 'Waktu Upload Terdeteksi' : 'Verified Upload Time'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-200 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeInfo.timezoneLabel}</span>
          </span>
          <button
            onClick={handleCopyDate}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
            title="Salin Waktu Upload Lengkap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? (isIndonesia ? 'Tersalin' : 'Copied') : (isIndonesia ? 'Salin' : 'Copy')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Hari, Tanggal, Jam, Menit, Detik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Huge Clock Display (Jam, Menit, Detik) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            {isIndonesia ? 'Pukul / Jam Upload Tepat' : 'Exact Upload Time'}
          </span>

          <div className="flex items-baseline gap-2 sm:gap-3 py-2">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <motion.span
                key={`h-${timeInfo.hours}`}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-white bg-slate-950/80 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-slate-800 shadow-inner"
              >
                {timeInfo.hours}
              </motion.span>
              <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {isIndonesia ? 'Jam' : 'Hour'}
              </span>
            </div>

            <span className="font-mono text-3xl sm:text-5xl font-black text-cyan-400 animate-pulse">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <motion.span
                key={`m-${timeInfo.minutes}`}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.05 }}
                className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-white bg-slate-950/80 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-slate-800 shadow-inner"
              >
                {timeInfo.minutes}
              </motion.span>
              <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {isIndonesia ? 'Menit' : 'Min'}
              </span>
            </div>

            <span className="font-mono text-3xl sm:text-5xl font-black text-cyan-400 animate-pulse">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <motion.span
                key={`s-${timeInfo.seconds}`}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.1 }}
                className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-cyan-300 bg-slate-950/80 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-cyan-900/60 shadow-inner"
              >
                {timeInfo.seconds}
              </motion.span>
              <span className="text-[11px] font-bold text-cyan-400 mt-1 uppercase tracking-wider">
                {isIndonesia ? 'Detik' : 'Sec'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Hari & Tanggal Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {/* Day of Week */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">
              {isIndonesia ? 'Hari' : 'Day'}:
            </span>
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 22 }}
                className="px-3 py-1 rounded-lg text-sm font-extrabold bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-rose-300 border border-rose-500/30"
              >
                {timeInfo.dayName}
              </motion.span>
            </div>
          </div>

          {/* Full Date */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {isIndonesia ? 'Tanggal' : 'Date'}:
            </span>
            <span className="text-sm font-bold text-slate-100">
              {timeInfo.formattedDate}
            </span>
          </div>

          {/* Relative Age */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-slate-400" />
              {isIndonesia ? 'Umur Video' : 'Age'}:
            </span>
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50"
            >
              <Sparkles className="w-3 h-3" />
              {relativeTime}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Epoch Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">UNIX EPOCH:</span>
          <span className="font-mono text-slate-300 font-semibold">{timeInfo.timestampSeconds}</span>
          <span className="text-slate-600">({timeInfo.timestampMs} ms)</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>ISO 8601 UTC:</span>
          <code className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {timeInfo.isoString}
          </code>
        </div>
      </div>

      {/* Helpful FAQ / Clarification Accordion */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 py-1 transition group"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition shrink-0" />
            <span className="text-slate-300">
              {isIndonesia
                ? 'Kok di aplikasi TikTok tertulis "1 hari yang lalu", tapi hasilnya hari Sabtu?'
                : 'Why does TikTok app show "1d ago" but the result is Saturday?'}
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 group-hover:underline">
            <span>{showFaq ? (isIndonesia ? 'Tutup' : 'Close') : (isIndonesia ? 'Pelajari Alasannya' : 'Learn Why')}</span>
            {showFaq ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        <AnimatePresence>
          {showFaq && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 bg-slate-950/90 p-4 rounded-xl border border-slate-800/90 text-xs leading-relaxed text-slate-300 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5 border border-cyan-800/60">
                  Faktor 1
                </span>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isIndonesia ? 'Aturan Pembulatan Kasar TikTok (Rentang 24–47 Jam):' : 'TikTok Relative Time Rounding (24–47 Hours):'}
                  </strong>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isIndonesia
                      ? 'Di aplikasi TikTok, selisih 24 jam sampai 47 jam 59 menit selalu disederhanakan menjadi label "1d ago" (1 hari lalu). Misalnya video diupload Sabtu malam pukul 23:00, saat kamu cek di hari Senin pagi pukul 09:00 (selisih 34 jam), TikTok tetap menampilkannya sebagai "1 hari lalu" karena belum mencapai 48 jam (2 hari). Padahal secara kalender, video memang diunggah hari Sabtu!'
                      : 'TikTok simplifies any duration between 24 and 47 hours 59 minutes as "1d ago". For instance, if a video was uploaded Saturday 11:00 PM, and viewed Monday 9:00 AM (34 hours later), TikTok still displays "1d ago" because it has not yet hit 48 hours (2d). Calendar-wise, it was indeed Saturday!'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5 border border-purple-800/60">
                  Faktor 2
                </span>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isIndonesia ? 'Presisi Detik Snowflake ID:' : 'Exact Second Snowflake Precision:'}
                  </strong>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isIndonesia
                      ? `Sistem kami tidak membulatkan angka, melainkan membongkar detik Unix Epoch asli langsung dari 32-bit pertama Video ID TikTok (${timeInfo.timestampSeconds}). Umur video di atas terdeteksi: "${relativeTime}".`
                      : `Our tool decodes the exact Unix Epoch second from TikTok's 64-bit ID (${timeInfo.timestampSeconds}) with full second precision: "${relativeTime}".`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5 border border-emerald-800/60">
                  Faktor 3
                </span>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isIndonesia ? 'Zona Waktu & Waktu Server Asal:' : 'Timezones & Country of Origin:'}
                  </strong>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isIndonesia
                      ? 'Pastikan zona waktu di menu atas sesuai (misal WIB UTC+7). Jika kreator berada di zona waktu barat (misal Amerika UTC-7/UTC-4), hari upload di sana bisa berbeda beberapa jam dengan hari di Indonesia. Kamu bisa cek kartu "Negara Asal" di bawah untuk melihat waktu lokal negara kreator.'
                      : 'Check the timezone dropdown at the top (e.g. WIB UTC+7 or Local). If the creator is in another timezone (e.g. US UTC-7/UTC-4), their calendar day may differ by several hours.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
