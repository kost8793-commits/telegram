/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TimezoneOption, VideoAnalysisResult, AppLanguage } from '../types';
import {
  extractVideoId,
  getTimestampFromVideoId,
  formatUploadDateTime,
  getTimeOfDayCategory,
  evaluatePrimeTime,
  formatRelativeTime,
  getSnowflakeBitwiseInfo,
  isShortUrl,
  extractAuthorHandle
} from '../utils/tiktok';
import { detectCountryOrigin } from '../utils/country';
import { TimeSpotlightCard } from './TimeSpotlightCard';
import { PrimeTimeBadge } from './PrimeTimeBadge';
import { CountryOriginCard } from './CountryOriginCard';
import { SnowflakeViewer } from './SnowflakeViewer';
import {
  Search,
  Clipboard,
  Sparkles,
  ArrowRight,
  Share2,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Video,
  AlertTriangle,
  Play,
  Film,
  MapPin,
  ShieldAlert,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, Variants } from 'motion/react';

const resultsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: 0.22,
      ease: 'easeInOut'
    }
  }
};

const resultItemVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      mass: 0.8
    }
  }
};

interface SingleAnalyzerProps {
  selectedTimezone: TimezoneOption;
  language: AppLanguage;
  currentResult: VideoAnalysisResult | null;
  onAnalysisSuccess: (result: VideoAnalysisResult) => void;
  onReset: () => void;
}

const SAMPLE_VIDEOS = [
  {
    label: 'Video Resmi TikTok',
    url: 'https://www.tiktok.com/@tiktok/video/7106594312292453658',
    category: 'Viral Official'
  },
  {
    label: 'Video ID Langsung',
    url: '7106594312292453658',
    category: 'Direct ID'
  },
  {
    label: 'Photo / Slideshow Mode',
    url: 'https://www.tiktok.com/@tiktok/photo/7106594312292453658',
    category: 'Photo Mode'
  },
  {
    label: 'Format URL Mobile',
    url: 'https://m.tiktok.com/v/7106594312292453658.html',
    category: 'Mobile Web'
  }
];

export const SingleAnalyzer: React.FC<SingleAnalyzerProps> = ({
  selectedTimezone,
  language,
  currentResult,
  onAnalysisSuccess,
  onReset,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(true);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const isIndonesia = language === 'id';

  // Trigger analysis for a given URL or text
  const performAnalysis = async (urlToAnalyze: string) => {
    const raw = urlToAnalyze.trim();
    if (!raw) {
      setErrorMessage(isIndonesia ? 'Silakan masukkan link atau Video ID TikTok.' : 'Please enter a TikTok URL or Video ID.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      // 1. Check if we can decode directly client-side first
      let videoId = extractVideoId(raw);
      let author = extractAuthorHandle(raw) || undefined;
      let title: string | undefined;
      let resolvedUrl = raw;
      let embedHtml: string | undefined;
      let locationName: string | undefined;
      let region: string | undefined;

      // If it's a shortlink (vt.tiktok.com, vm.tiktok.com, tiktok.com/t/) or has no videoId yet, ask the backend
      if (isShortUrl(raw) || !videoId) {
        try {
          const res = await fetch('/api/tiktok/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: raw })
          });

          const data = await res.json();
          if (data.success && data.videoId) {
            videoId = data.videoId;
            resolvedUrl = data.resolvedUrl || raw;
            author = data.author || author;
            title = data.title;
            embedHtml = data.embedHtml;
            locationName = data.locationName;
            region = data.region;
          } else {
            throw new Error(data.error || 'Gagal mengekstrak ID Video dari link.');
          }
        } catch (serverErr: any) {
          // If server error occurred but we have videoId from client regex
          if (!videoId) {
            throw serverErr;
          }
        }
      }

      if (!videoId) {
        throw new Error(
          isIndonesia
            ? 'Tidak dapat mendeteksi ID video dari link tersebut. Pastikan link video TikTok valid.'
            : 'Could not extract TikTok Video ID. Please provide a valid link.'
        );
      }

      // 2. Decode timestamp using TikTok 64-bit snowflake algorithm
      const tsData = getTimestampFromVideoId(videoId);
      if (!tsData) {
        throw new Error(
          isIndonesia
            ? 'Format ID Video tidak sesuai dengan standar penanggalan TikTok.'
            : 'Invalid Video ID timestamp.'
        );
      }

      // 3. Format Date, Day, Hour, Minute, Second according to selected timezone
      const timeInfo = formatUploadDateTime(
        tsData.timestampSeconds,
        selectedTimezone.offsetHours,
        language,
        selectedTimezone.id
      );

      const hourNum = parseInt(timeInfo.hours, 10);
      const timeOfDay = getTimeOfDayCategory(hourNum);
      const primeTime = evaluatePrimeTime(hourNum, new Date(tsData.timestampMs).getDay());
      const relativeTime = formatRelativeTime(tsData.timestampSeconds);
      const snowflake = getSnowflakeBitwiseInfo(videoId);

      const countryOrigin = detectCountryOrigin({
        url: resolvedUrl || raw,
        title,
        author,
        locationName,
        region,
        timestampSeconds: tsData.timestampSeconds
      });

      const result: VideoAnalysisResult = {
        videoId,
        originalUrl: raw,
        resolvedUrl,
        author,
        title,
        locationName,
        region: region || 'ID (Asia/Jakarta)',
        countryOrigin,
        embedHtml,
        timestampSeconds: tsData.timestampSeconds,
        timestampMs: tsData.timestampMs,
        timeInfo,
        timeOfDay,
        primeTime,
        relativeTime,
        snowflake,
        analyzedAt: Date.now()
      };

      onAnalysisSuccess(result);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Trigger celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menganalisa link TikTok');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        performAnalysis(text);
      }
    } catch {
      // Fallback
    }
  };

  // Re-format timeInfo if user switches timezone while looking at results
  const activeTimeInfo = currentResult
    ? formatUploadDateTime(
        currentResult.timestampSeconds,
        selectedTimezone.offsetHours,
        language,
        selectedTimezone.id
      )
    : null;

  const activeTimeOfDay = activeTimeInfo
    ? getTimeOfDayCategory(parseInt(activeTimeInfo.hours, 10))
    : currentResult?.timeOfDay;

  const activePrimeTime = activeTimeInfo && currentResult
    ? evaluatePrimeTime(
        parseInt(activeTimeInfo.hours, 10),
        new Date(currentResult.timestampMs + selectedTimezone.offsetHours * 3600 * 1000).getUTCDay()
      )
    : currentResult?.primeTime;

  const handleCopyReport = () => {
    if (!currentResult || !activeTimeInfo || !activeTimeOfDay || !activePrimeTime) return;
    const { videoId, author, relativeTime, countryOrigin } = currentResult;

    const report = `🎯 HASIL ANALISIS WAKTU UPLOAD & NEGARA ASAL TIKTOK
━━━━━━━━━━━━━━━━━━━━
📌 Video ID: ${videoId}
👤 Akun / Author: ${author || 'Tidak diketahui'}
🌏 NEGARA ASAL: ${countryOrigin.flagEmoji} ${countryOrigin.countryName} (${countryOrigin.continent})
📊 Akurasi Deteksi: ${countryOrigin.confidence}% (${countryOrigin.confidenceLabel})

📅 HARI: ${activeTimeInfo.dayName}
🗓️ TANGGAL: ${activeTimeInfo.formattedDateWithDay}
⏰ JAM & MENIT: ${activeTimeInfo.formattedTime} ${activeTimeInfo.timezoneLabel}
🌐 Waktu Lokal di Negara Asal: ${countryOrigin.localUploadTime}
⌛ UMUR VIDEO: ${relativeTime}

🌅 SLOT WAKTU: ${activeTimeOfDay.periodName}
🔥 RATING SLOT: ${activePrimeTime.badge}
💡 INSIGHT: ${activePrimeTime.advice}
━━━━━━━━━━━━━━━━━━━━
Diperiksa dengan TikTok TimeLens (Snowflake 64-Bit)`;

    navigator.clipboard.writeText(report);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section & Search Input */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{isIndonesia ? 'Analisis Link TikTok Otomatis & Akurat' : 'Instant & Precise TikTok Link Parser'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {isIndonesia ? (
              <>
                Ketahui Kapan Video TikTok Diupload{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-rose-400">
                  Lengkap Hingga Menit
                </span>
              </>
            ) : (
              <>
                Know Exact TikTok Upload Time{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-rose-400">
                  Down to the Second
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isIndonesia
              ? 'Cukup tempel link video TikTok (termasuk shortlink vt.tiktok.com). Sistem akan membongkar waktu upload asli: Hari, Tanggal, Jam, dan Menit dengan teknologi Snowflake ID.'
              : 'Paste any TikTok video or shortlink. Decodes the exact upload date, day of week, hour, and minute with 64-bit precision.'}
          </p>

          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performAnalysis(inputUrl);
            }}
            className="pt-4"
          >
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-slate-950 p-2 rounded-2xl border-2 border-slate-700/80 focus-within:border-cyan-400 shadow-2xl transition">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                  <Search className="w-5 h-5 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={
                    isIndonesia
                      ? 'Tempel link TikTok (misal: https://vt.tiktok.com/... atau https://www.tiktok.com/@.../video/...)'
                      : 'Paste TikTok link (e.g. https://vt.tiktok.com/... or https://www.tiktok.com/@.../video/...)'
                  }
                  className="w-full bg-transparent pl-11 pr-24 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
                />

                {/* Paste from clipboard button */}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition border border-slate-700"
                  title="Tempel dari Clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">{isIndonesia ? 'Tempel' : 'Paste'}</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-rose-500 hover:opacity-90 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>{isIndonesia ? 'Menganalisa...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isIndonesia ? 'Analisa Sekarang' : 'Analyze Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/80 py-2.5 px-4 rounded-xl max-w-xl mx-auto"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Sample Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              {isIndonesia ? 'Coba Contoh:' : 'Try Samples:'}
            </span>
            {SAMPLE_VIDEOS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputUrl(sample.url);
                  performAnalysis(sample.url);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center gap-1.5"
              >
                <Film className="w-3 h-3 text-cyan-400" />
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Result View */}
      <AnimatePresence mode="wait">
        {currentResult && activeTimeInfo && (
          <motion.div
            key={currentResult.videoId}
            ref={resultsRef}
            variants={resultsContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6 pt-2"
          >
            {/* Action and Reset Bar */}
            <motion.div
              variants={resultItemVariants}
              className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {isIndonesia ? 'Hasil untuk Video ID:' : 'Results for Video ID:'}
                </span>
                <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {currentResult.videoId}
                </span>
                {currentResult.author && (
                  <span className="text-xs font-semibold text-rose-400 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-800/50">
                    {currentResult.author}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition"
                >
                  {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{reportCopied ? (isIndonesia ? 'Laporan Tersalin!' : 'Report Copied!') : (isIndonesia ? 'Salin Laporan' : 'Copy Report')}</span>
                </button>

                <a
                  href={`https://www.tiktok.com/@tiktok/video/${currentResult.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm shadow-rose-900/30"
                >
                  <span>{isIndonesia ? 'Buka di TikTok' : 'Open in TikTok'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    onReset();
                    setInputUrl('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
                  title="Reset / Analisa Link Baru"
                  aria-label="Reset Analisis"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Spotlight Card - Jam, Tanggal, Hari, Menit */}
            <motion.div variants={resultItemVariants}>
              <TimeSpotlightCard
                timeInfo={activeTimeInfo}
                relativeTime={currentResult.relativeTime}
                isIndonesia={isIndonesia}
              />
            </motion.div>

            {/* Country of Origin Card */}
            <motion.div variants={resultItemVariants}>
              <CountryOriginCard
                country={currentResult.countryOrigin}
                isIndonesia={isIndonesia}
              />
            </motion.div>

            {/* Secondary Grid: Time of Day Prime Slot & Video Preview */}
            <motion.div
              variants={resultItemVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Prime Time / Algorithm Slot */}
              <div className="lg:col-span-7">
                <PrimeTimeBadge
                  timeOfDay={activeTimeOfDay || currentResult.timeOfDay}
                  primeTime={activePrimeTime || currentResult.primeTime}
                  hour={parseInt(activeTimeInfo.hours, 10)}
                  isIndonesia={isIndonesia}
                />
              </div>

              {/* Embedded TikTok Player / Preview */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {isIndonesia ? 'Pemutar Video TikTok' : 'TikTok Player'}
                      </h4>
                    </div>

                    <button
                      onClick={() => setShowEmbed(!showEmbed)}
                      className="text-[11px] text-slate-400 hover:text-cyan-400 font-medium"
                    >
                      {showEmbed ? (isIndonesia ? 'Sembunyikan' : 'Hide') : (isIndonesia ? 'Tampilkan' : 'Show')}
                    </button>
                  </div>

                  {showEmbed ? (
                    <div className="relative aspect-[9/16] max-h-[380px] w-full max-w-[240px] mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
                      <iframe
                        src={`https://www.tiktok.com/player/v1/${currentResult.videoId}?autoplay=0`}
                        className="w-full h-full border-0"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="TikTok Embed Player"
                      />
                    </div>
                  ) : (
                    <div className="h-44 rounded-xl border border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-center p-4">
                      <Play className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-xs text-slate-400">
                        {isIndonesia ? 'Pemutar disembunyikan' : 'Player hidden'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>ID: {currentResult.videoId}</span>
                  <a
                    href={`https://www.tiktok.com/@tiktok/video/${currentResult.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Link Langsung</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Location & Geo Analysis Card */}
            <motion.div
              variants={resultItemVariants}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{isIndonesia ? 'Analisis Lokasi & Geografis Video' : 'Location & Geotargeting Analysis'}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        OSINT Insights
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isIndonesia ? 'Pelacakan stiker POI, region server, dan kebijakan privasi GPS' : 'Tagged POI, server region, and GPS privacy policy'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
                    Region: {currentResult.region || 'ID (Asia/Jakarta)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* POI Tag Status */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {isIndonesia ? 'Stiker Tag Lokasi (POI):' : 'Tagged Location Sticker (POI):'}
                  </span>
                  {currentResult.locationName ? (
                    <p className="text-sm font-extrabold text-white bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60">
                      📍 {currentResult.locationName}
                    </p>
                  ) : (
                    <p className="text-slate-400 leading-relaxed">
                      {isIndonesia
                        ? 'Tidak ada tag lokasi publik (POI) yang disematkan kreator pada video ini.'
                        : 'No public location anchor/POI attached by the creator to this video.'}
                    </p>
                  )}
                </div>

                {/* Privacy & EXIF explanation */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    {isIndonesia ? 'Kebijakan Privasi GPS TikTok:' : 'TikTok GPS Privacy Policy:'}
                  </span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {isIndonesia
                      ? 'TikTok secara otomatis menghapus koordinat GPS mentah (EXIF latitude/longitude rumah/tempat tinggal) saat video diupload demi keamanan pengguna dari doxxing. Lokasi fisik hanya dapat terlihat jika kreator secara sengaja menyematkan tag tempat publik saat memposting.'
                      : 'TikTok strips raw EXIF satellite GPS coordinates on upload to safeguard creator privacy against doxxing. Location is only public if the creator explicitly tags a venue/city POI.'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Snowflake ID Bitwise Tech Card */}
            <motion.div variants={resultItemVariants}>
              <SnowflakeViewer
                snowflake={currentResult.snowflake}
                videoId={currentResult.videoId}
                isIndonesia={isIndonesia}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
