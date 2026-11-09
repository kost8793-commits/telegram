/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SnowflakeInfo } from '../utils/tiktok';
import { Cpu, Terminal, ShieldCheck, Check, Copy, Info } from 'lucide-react';

interface SnowflakeViewerProps {
  snowflake: SnowflakeInfo | null;
  videoId?: string;
  isIndonesia: boolean;
}

export const SnowflakeViewer: React.FC<SnowflakeViewerProps> = ({
  snowflake,
  videoId = '7106594312292453658',
  isIndonesia,
}) => {
  const [copied, setCopied] = useState(false);

  const sampleId = snowflake ? snowflake.videoId : videoId;
  const binaryTimestamp = snowflake ? snowflake.binaryTimestamp : '01100010100111100111011100111111';
  const binaryWorker = snowflake ? snowflake.binaryWorker : '01010001001011000000011011111010';
  const decimalTimestamp = snowflake ? snowflake.decimalTimestamp : 1654632927;

  const handleCopyCode = () => {
    const code = `const videoId = "${sampleId}";\nconst timestamp = Number(BigInt(videoId) >> 32n);\nconst uploadDate = new Date(timestamp * 1000);\nconsole.log("Waktu upload akurat:", uploadDate.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{isIndonesia ? 'Teknologi TikTok Snowflake 64-Bit' : 'TikTok 64-Bit Snowflake Architecture'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                100% Akurat
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isIndonesia
                ? 'Bagaimana waktu upload jam, menit & tanggal video bisa diketahui hanya dari link'
                : 'Why TikTok video upload times can be perfectly decoded mathematically from the ID'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti Manipulasi</span>
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
          <p>
            Setiap video di TikTok memiliki <strong>Video ID unik 64-bit</strong> (misalnya <code className="text-cyan-300 font-mono">{sampleId}</code>).
            Sistem ByteDance menggunakan arsitektur <em>Snowflake ID</em> mirip dengan Twitter & Discord.
          </p>
          <p className="text-slate-400">
            <strong>32 bit pertama</strong> menyimpan detik Unix Epoch saat video dibuat di server TikTok.
            Karena nomor ID ini permanen dan ada di dalam URL video, waktu upload hingga detik, menit, jam, hari, dan tanggal bisa dihitung secara pasti tanpa perlu login akun TikTok!
          </p>
        </div>
      </div>

      {/* Visual Bit Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">Struktur Biner 64-Bit Video ID:</span>
          <span className="font-mono text-cyan-400">ID: {sampleId}</span>
        </div>

        {/* 64-bit visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 32 Bits Timestamp */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 shadow-sm relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Bit 0-31: Unix Timestamp (Detik)
              </span>
              <span className="text-xs font-mono font-bold text-white bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {decimalTimestamp}
              </span>
            </div>
            <p className="font-mono text-xs text-cyan-200 tracking-wider break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              {binaryTimestamp.replace(/(.{4})/g, '$1 ')}
            </p>
            <span className="text-[10px] text-slate-400 mt-2 block">
              → Menghasilkan detik epoch sejak 1970, mengunci jam, menit & tanggal permanen.
            </span>
          </div>

          {/* 32 Bits Sequence / Worker */}
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 shadow-sm relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Bit 32-63: Cluster & Worker Sequence
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                Data Node Server
              </span>
            </div>
            <p className="font-mono text-xs text-purple-200 tracking-wider break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              {binaryWorker.replace(/(.{4})/g, '$1 ')}
            </p>
            <span className="text-[10px] text-slate-400 mt-2 block">
              → Mengidentifikasi datacenter dan urutan video dalam milidetik yang sama.
            </span>
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-300">
              Formula JavaScript / Node.js
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`// 1. Ambil Video ID dari Link TikTok
const videoId = "${sampleId}";

// 2. Bitwise Right-Shift 32-bit BigInt
const timestamp = Number(BigInt(videoId) >> 32n);

// 3. Konversi ke Tanggal & Jam (WIB / Asia/Jakarta)
const uploadDate = new Date(timestamp * 1000);
console.log(uploadDate.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
// Output: ${new Date(decimalTimestamp * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`}
        </pre>
      </div>
    </div>
  );
};
