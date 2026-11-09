/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, TimezoneOption, TIMEZONE_OPTIONS, VideoAnalysisResult, AppLanguage } from './types';
import { Header } from './components/Header';
import { SingleAnalyzer } from './components/SingleAnalyzer';
import { BatchAnalyzer } from './components/BatchAnalyzer';
import { BotSimulator } from './components/BotSimulator';
import { SnowflakeViewer } from './components/SnowflakeViewer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Sparkles, Shield, Cpu, HelpCircle, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'tiktok_timelens_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  const [selectedTimezone, setSelectedTimezone] = useState<TimezoneOption>(TIMEZONE_OPTIONS[0]); // WIB by default
  const [language, setLanguage] = useState<AppLanguage>('id');
  const [currentResult, setCurrentResult] = useState<VideoAnalysisResult | null>(null);
  const [history, setHistory] = useState<VideoAnalysisResult[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveHistory = (items: VideoAnalysisResult[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
    } catch {
      // Ignore
    }
  };

  const handleAnalysisSuccess = (result: VideoAnalysisResult) => {
    setCurrentResult(result);
    // Add to history without duplicates
    const filtered = history.filter((h) => h.videoId !== result.videoId);
    saveHistory([result, ...filtered]);
  };

  const handleSelectFromHistory = (item: VideoAnalysisResult) => {
    setCurrentResult(item);
    setActiveTab('single');
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleRemoveHistoryItem = (videoId: string) => {
    saveHistory(history.filter((h) => h.videoId !== videoId));
  };

  const isIndonesia = language === 'id';

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={setSelectedTimezone}
        language={language}
        onLanguageChange={setLanguage}
        historyCount={history.length}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'single' && (
          <SingleAnalyzer
            selectedTimezone={selectedTimezone}
            language={language}
            currentResult={currentResult}
            onAnalysisSuccess={handleAnalysisSuccess}
            onReset={() => setCurrentResult(null)}
          />
        )}

        {activeTab === 'batch' && (
          <BatchAnalyzer
            selectedTimezone={selectedTimezone}
            isIndonesia={isIndonesia}
          />
        )}

        {activeTab === 'bot' && (
          <BotSimulator />
        )}

        {activeTab === 'snowflake' && (
          <div className="max-w-4xl mx-auto">
            <SnowflakeViewer
              snowflake={currentResult ? currentResult.snowflake : null}
              videoId={currentResult ? currentResult.videoId : undefined}
              isIndonesia={isIndonesia}
            />
          </div>
        )}

        {/* Informative FAQ / Value Props Section at Bottom */}
        <section className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {isIndonesia ? 'Algoritma Snowflake 64-Bit' : '64-Bit Snowflake Algorithm'}
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  {isIndonesia
                    ? 'Waktu upload tertanam permanen di 32 bit pertama Video ID TikTok. Akurat hingga jam, menit, dan detik tanpa perkiraan.'
                    : 'Upload time is encoded directly in the upper 32 bits of TikTok snowflake IDs. Exact to the second.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {isIndonesia ? 'Dukungan Shortlink & Mobile' : 'Shortlink & Mobile Ready'}
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  {isIndonesia
                    ? 'Bisa membaca link vt.tiktok.com, vm.tiktok.com, tautan aplikasi HP, mode foto, maupun ID angka mentah.'
                    : 'Supports vt.tiktok.com, vm.tiktok.com, share links from mobile apps, photo carousels, and raw IDs.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {isIndonesia ? 'Privasi & Tanpa Login' : '100% Privacy & No Login'}
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  {isIndonesia
                    ? 'Tidak perlu menghubungkan akun atau login TikTok. Aman untuk riset kompetitor, audit OSINT, dan analisis kreator.'
                    : 'Zero login required. Safe for creator schedule research, marketing audits, and OSINT investigation.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            TikTok TimeLens • Analisis Waktu Upload TikTok Terpercaya
          </p>
          <p className="text-[11px] text-slate-600">
            Alat bantu independen berbasis teknologi Snowflake ID. TikTok adalah merek dagang terdaftar milik ByteDance Ltd.
          </p>
        </div>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={handleSelectFromHistory}
        onClear={handleClearHistory}
        onRemove={handleRemoveHistoryItem}
        isIndonesia={isIndonesia}
      />
    </div>
  );
}
