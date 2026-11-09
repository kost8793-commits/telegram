/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveTab, TimezoneOption, TIMEZONE_OPTIONS, AppLanguage } from '../types';
import { Clock, Layers, Bot, Cpu, History, Globe, Share2, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedTimezone: TimezoneOption;
  onTimezoneChange: (tz: TimezoneOption) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  historyCount: number;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedTimezone,
  onTimezoneChange,
  language,
  onLanguageChange,
  historyCount,
  onToggleHistory,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-black via-slate-900 to-black border border-slate-700/60 shadow-lg shadow-cyan-500/10 group cursor-pointer"
                 onClick={() => onTabChange('single')}>
              {/* TikTok colorful glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 rounded-xl opacity-30 group-hover:opacity-75 blur transition duration-300"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-slate-950 rounded-xl">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.94-4.47V8.71a8.21 8.21 0 0 0 4.83 1.54v-3.5a4.85 4.85 0 0 1-1-.06z"/>
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                  TikTok TimeLens
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 tracking-wider">
                  SNOWFLAKE 64-BIT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {language === 'id' ? 'Cek Jam, Tanggal & Hari Upload Video' : 'Exact Video Upload Timestamp & Analytics'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('single')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-rose-500/20 text-white border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'id' ? 'Analisa Link' : 'Single Link'}</span>
            </button>

            <button
              onClick={() => onTabChange('batch')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-rose-500/20 text-white border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{language === 'id' ? 'Bandingkan (Multi)' : 'Batch Compare'}</span>
            </button>

            <button
              onClick={() => onTabChange('bot')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bot'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-rose-500/20 text-white border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'id' ? 'Mode Bot' : 'Bot Mode'}</span>
            </button>

            <button
              onClick={() => onTabChange('snowflake')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'snowflake'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-rose-500/20 text-white border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'id' ? 'Info Snowflake' : 'Snowflake Tech'}</span>
            </button>
          </nav>

          {/* Right Controls: Timezone, Language, History */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timezone selector */}
            <div className="relative">
              <label htmlFor="timezone-select" className="sr-only">Pilih Zona Waktu</label>
              <select
                id="timezone-select"
                value={selectedTimezone.id}
                onChange={(e) => {
                  const found = TIMEZONE_OPTIONS.find((t) => t.id === e.target.value);
                  if (found) onTimezoneChange(found);
                }}
                className="bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer font-medium"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language toggle */}
            <button
              onClick={() => onLanguageChange(language === 'id' ? 'en' : 'id')}
              className="px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Share / Copy App Link Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:border-slate-700"
              title="Salin Link Web Aplikasi Ini"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-rose-400" />}
              <span>{copiedLink ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Link Web' : 'Share')}</span>
            </button>

            {/* History Toggle Button */}
            <button
              onClick={onToggleHistory}
              className="relative p-1.5 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Riwayat Analisis"
              aria-label="Buka Riwayat Analisis"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Subnav for tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/60 scrollbar-none">
          <button
            onClick={() => onTabChange('single')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium ${
              activeTab === 'single' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Analisa Link</span>
          </button>
          <button
            onClick={() => onTabChange('batch')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium ${
              activeTab === 'batch' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Bandingkan</span>
          </button>
          <button
            onClick={() => onTabChange('bot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium ${
              activeTab === 'bot' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Mode Bot</span>
          </button>
          <button
            onClick={() => onTabChange('snowflake')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium ${
              activeTab === 'snowflake' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Snowflake</span>
          </button>
        </div>
      </div>
    </header>
  );
};
