/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VideoAnalysisResult } from '../types';
import { X, Trash2, Clock, Calendar, ArrowRight, Play } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: VideoAnalysisResult[];
  onSelect: (item: VideoAnalysisResult) => void;
  onClear: () => void;
  onRemove: (videoId: string) => void;
  isIndonesia: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onRemove,
  isIndonesia,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isIndonesia ? 'Riwayat Analisis' : 'Analysis History'}
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-900/60 transition"
                title="Hapus Semua Riwayat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isIndonesia ? 'Hapus' : 'Clear'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup Riwayat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
              <Clock className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
              <p className="text-xs font-medium">
                {isIndonesia ? 'Belum ada riwayat analisis' : 'No analysis history yet'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                {isIndonesia
                  ? 'Video TikTok yang kamu analisa akan otomatis tersimpan di sini.'
                  : 'TikTok links you inspect will be saved here automatically.'}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.videoId}
                className="group p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition shadow-sm hover:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-cyan-400 font-mono">
                      {item.author || `@tiktok_video`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: {item.videoId.slice(-6)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.videoId);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Hapus item ini"
                    aria-label={`Hapus riwayat video ${item.videoId}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload details */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span>{item.timeInfo.dayName}, {item.timeInfo.formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{item.timeInfo.hours}:{item.timeInfo.minutes}:{item.timeInfo.seconds} {item.timeInfo.timezoneLabel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <span className="text-[11px] text-slate-500">{item.relativeTime}</span>
                  <button
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-0.5 transition"
                  >
                    <span>{isIndonesia ? 'Buka Analisis' : 'View'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
