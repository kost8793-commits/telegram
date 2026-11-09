/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TimezoneOption } from '../types';
import { extractVideoId, getTimestampFromVideoId, formatUploadDateTime, getTimeOfDayCategory, evaluatePrimeTime } from '../utils/tiktok';
import { detectCountryOrigin } from '../utils/country';
import { Layers, Play, Check, Copy, Download, Trash2, ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BatchItem {
  id: string;
  originalUrl: string;
  videoId?: string;
  timestampSeconds?: number;
  formattedDate?: string;
  dayName?: string;
  hours?: string;
  minutes?: string;
  seconds?: string;
  countryFlag?: string;
  countryName?: string;
  timeSlot?: string;
  primeBadge?: string;
  error?: string;
}

interface BatchAnalyzerProps {
  selectedTimezone: TimezoneOption;
  isIndonesia: boolean;
}

const SAMPLE_BATCH = [
  'https://www.tiktok.com/@tiktok/video/7106594312292453658',
  'https://www.tiktok.com/@tiktok/video/7215438290123456789',
  'https://www.tiktok.com/@creator/video/7345678901234567890',
  'https://www.tiktok.com/@indonesia/video/7187654321098765432'
].join('\n');

export const BatchAnalyzer: React.FC<BatchAnalyzerProps> = ({
  selectedTimezone,
  isIndonesia,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchItem[]>([]);
  const [copied, setCopied] = useState(false);

  const handleRunBatch = async () => {
    const rawLines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) return;

    setLoading(true);
    const parsedItems: BatchItem[] = [];

    // Parse each line (client-side instant + fallback)
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      let videoId = extractVideoId(line);

      // If shortlink, query backend
      if (!videoId && (line.includes('vt.tiktok') || line.includes('vm.tiktok') || line.includes('tiktok.com/t'))) {
        try {
          const res = await fetch('/api/tiktok/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: line })
          });
          const data = await res.json();
          if (data.success && data.videoId) {
            videoId = data.videoId;
          }
        } catch {
          // ignore
        }
      }

      if (!videoId) {
        parsedItems.push({
          id: String(i),
          originalUrl: line,
          error: isIndonesia ? 'ID Video tidak terdeteksi' : 'Video ID not found'
        });
        continue;
      }

      const tsData = getTimestampFromVideoId(videoId);
      if (!tsData) {
        parsedItems.push({
          id: String(i),
          originalUrl: line,
          videoId,
          error: isIndonesia ? 'Timestamp tidak valid' : 'Invalid timestamp'
        });
        continue;
      }

      const timeFormatted = formatUploadDateTime(
        tsData.timestampSeconds,
        selectedTimezone.offsetHours,
        isIndonesia ? 'id' : 'en',
        selectedTimezone.id
      );

      const timeOfDay = getTimeOfDayCategory(parseInt(timeFormatted.hours, 10));
      const prime = evaluatePrimeTime(
        parseInt(timeFormatted.hours, 10),
        new Date(tsData.timestampMs).getDay()
      );

      const country = detectCountryOrigin({
        url: line,
        timestampSeconds: tsData.timestampSeconds
      });

      parsedItems.push({
        id: String(i),
        originalUrl: line,
        videoId,
        timestampSeconds: tsData.timestampSeconds,
        formattedDate: timeFormatted.formattedDate,
        dayName: timeFormatted.dayName,
        hours: timeFormatted.hours,
        minutes: timeFormatted.minutes,
        seconds: timeFormatted.seconds,
        countryFlag: country.flagEmoji,
        countryName: country.countryName,
        timeSlot: timeOfDay.periodName,
        primeBadge: prime.badge
      });
    }

    setResults(parsedItems);
    setLoading(false);
  };

  const handleCopyReport = () => {
    const valid = results.filter((r) => !r.error);
    const text = valid
      .map(
        (r, idx) =>
          `${idx + 1}. Video ID: ${r.videoId}\n   🌍 ${r.countryFlag || '🌐'} ${r.countryName || 'Unknown'}\n   📅 ${r.dayName}, ${r.formattedDate}\n   ⏰ ${r.hours}:${r.minutes}:${r.seconds} ${selectedTimezone.id}\n   Slot: ${r.timeSlot} (${r.primeBadge})`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const valid = results.filter((r) => !r.error);
    const headers = ['Video ID', 'Negara Asal', 'Hari', 'Tanggal', 'Jam', 'Menit', 'Detik', 'Zona Waktu', 'Slot', 'Rating Slot', 'URL'];
    const rows = valid.map((r) => [
      r.videoId,
      `"${r.countryFlag || ''} ${r.countryName || ''}"`.trim(),
      r.dayName,
      `"${r.formattedDate}"`,
      r.hours,
      r.minutes,
      r.seconds,
      selectedTimezone.id,
      `"${r.timeSlot}"`,
      `"${r.primeBadge}"`,
      `"${r.originalUrl}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tiktok_upload_times_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregated Statistics
  const validResults = results.filter((r) => !r.error);
  const dayCounts: Record<string, number> = {};
  validResults.forEach((r) => {
    if (r.dayName) {
      dayCounts[r.dayName] = (dayCounts[r.dayName] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isIndonesia ? 'Bandingkan Banyak Link Sekaligus (Batch Mode)' : 'Multi-Link Batch Comparison'}
              </h2>
              <p className="text-xs text-slate-400">
                {isIndonesia
                  ? 'Analisa jam upload beberapa video kompetitor atau akun sendiri sekaligus untuk melihat pola postingan.'
                  : 'Compare upload times across multiple competitor or channel links to detect scheduling patterns.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setInputText(SAMPLE_BATCH)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 transition"
          >
            {isIndonesia ? 'Muat Contoh Link' : 'Load Sample Links'}
          </button>
        </div>

        {/* Textarea */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            {isIndonesia ? 'Tempel Link Video TikTok (1 baris per link, maksimal 15):' : 'Paste TikTok Links (1 line per link, max 15):'}
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`https://www.tiktok.com/@tiktok/video/7106594312292453658\nhttps://vt.tiktok.com/ZS.../\nhttps://www.tiktok.com/@user/video/7234567890123456789`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600 leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Zona waktu: <strong className="text-slate-300">{selectedTimezone.label}</strong>
            </span>

            <div className="flex items-center gap-2">
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setResults([]);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg bg-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isIndonesia ? 'Kosongkan' : 'Clear'}</span>
                </button>
              )}

              <button
                onClick={handleRunBatch}
                disabled={loading || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-purple-900/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? (isIndonesia ? 'Menganalisa...' : 'Analyzing...') : (isIndonesia ? 'Analisa Semua Link' : 'Analyze All Links')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Top Aggregation Summary */}
            {validResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Total Dianalisa</span>
                    <p className="text-2xl font-black text-white">{validResults.length} Video</p>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg text-purple-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Hari Terbanyak</span>
                    <p className="text-xl font-bold text-cyan-400">
                      {Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg text-cyan-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Ekspor Data</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={handleCopyReport}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 border border-slate-700 transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>
                      <button
                        onClick={handleDownloadCsv}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 border border-slate-700 transition"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Video ID</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Negara Asal' : 'Country'}</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Hari' : 'Day'}</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Tanggal Unggah' : 'Upload Date'}</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Jam & Menit' : 'Time'}</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Slot Waktu' : 'Slot'}</th>
                      <th className="px-4 py-3">{isIndonesia ? 'Rating Slot' : 'Slot Rating'}</th>
                      <th className="px-4 py-3 text-right">{isIndonesia ? 'Aksi' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.map((r, idx) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 + idx * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {r.videoId ? (
                            <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {r.videoId}
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium">{r.error}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.countryName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                              <span className="text-sm">{r.countryFlag}</span>
                              <span>{r.countryName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-rose-300">
                          {r.dayName || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-medium">
                          {r.formattedDate || '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-cyan-300 font-bold">
                          {r.hours && r.minutes ? `${r.hours}:${r.minutes}:${r.seconds} ${selectedTimezone.id}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {r.timeSlot || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {r.primeBadge ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                              {r.primeBadge}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.videoId && (
                            <a
                              href={`https://www.tiktok.com/@tiktok/video/${r.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 font-medium"
                            >
                              <span>Buka</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
