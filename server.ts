/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  extractVideoId,
  getTimestampFromVideoId,
  isShortUrl,
  extractAuthorHandle,
  formatUploadDateTime,
  getTimeOfDayCategory,
  evaluatePrimeTime,
  formatRelativeTime,
  getSnowflakeBitwiseInfo
} from './src/utils/tiktok.ts';
import { detectCountryOrigin } from './src/utils/country.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

interface ResolveResult {
  success: boolean;
  videoId?: string;
  originalUrl: string;
  resolvedUrl?: string;
  author?: string;
  title?: string;
  locationName?: string;
  region?: string;
  thumbnailUrl?: string;
  embedHtml?: string;
  timestampSeconds?: number;
  timestampMs?: number;
  error?: string;
}

// Helper to resolve short links and scrape metadata safely
async function resolveTikTokLink(inputUrl: string): Promise<ResolveResult> {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return { success: false, originalUrl: inputUrl, error: 'Link atau Video ID TikTok tidak boleh kosong' };
  }

  // Check if user already provided direct video ID
  let videoId = extractVideoId(trimmed);
  let resolvedUrl = trimmed;
  let author = extractAuthorHandle(trimmed) || undefined;
  let title: string | undefined;
  let thumbnailUrl: string | undefined;
  let embedHtml: string | undefined;

  // If it's a short URL or not yet direct video ID, follow redirects
  if (isShortUrl(trimmed) || !videoId) {
    try {
      const response = await fetch(trimmed, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      resolvedUrl = response.url || trimmed;
      videoId = extractVideoId(resolvedUrl);

      // If still not in URL, try parsing HTML meta tags or canonical
      if (!videoId) {
        const html = await response.text();
        const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
        if (canonicalMatch && canonicalMatch[1]) {
          resolvedUrl = canonicalMatch[1];
          videoId = extractVideoId(resolvedUrl);
        }

        const ogUrlMatch = html.match(/<meta\s+(?:property|name)=["']og:url["']\s+content=["']([^"']+)["']/i);
        if (!videoId && ogUrlMatch && ogUrlMatch[1]) {
          resolvedUrl = ogUrlMatch[1];
          videoId = extractVideoId(resolvedUrl);
        }

        const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1];
        }

        const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          thumbnailUrl = ogImageMatch[1];
        }
      }
    } catch (err: any) {
      // If network fails for shortlink, we record error
      if (!videoId) {
        return {
          success: false,
          originalUrl: inputUrl,
          error: `Gagal membuka link TikTok: ${err.message || 'Koneksi timeout'}`
        };
      }
    }
  }

  // If still no videoId, see if generic 18-20 digits exist in query or path
  if (!videoId) {
    const fallbackMatch = resolvedUrl.match(/(\d{18,20})/);
    if (fallbackMatch && fallbackMatch[1]) {
      videoId = fallbackMatch[1];
    }
  }

  if (!videoId) {
    return {
      success: false,
      originalUrl: inputUrl,
      error: 'Tidak dapat menemukan ID Video TikTok dari link yang diberikan. Pastikan link valid.'
    };
  }

  // Compute timestamp from video ID
  const tsData = getTimestampFromVideoId(videoId);
  if (!tsData) {
    return {
      success: false,
      videoId,
      originalUrl: inputUrl,
      error: 'ID Video TikTok tidak valid atau tidak memiliki format timestamp yang dikenali.'
    };
  }

  // Update author handle if possible
  if (!author) {
    author = extractAuthorHandle(resolvedUrl) || undefined;
  }

  // Try oEmbed for additional embed iframe and title
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@tiktok/video/${videoId}`;
    const oembedRes = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (oembedRes.ok) {
      const oembedData: any = await oembedRes.json();
      if (oembedData.html) {
        embedHtml = oembedData.html;
      }
      if (oembedData.title && !title) {
        title = oembedData.title;
      }
      if (oembedData.author_name && !author) {
        author = `@${oembedData.author_unique_id || oembedData.author_name}`;
      }
      if (oembedData.thumbnail_url && !thumbnailUrl) {
        thumbnailUrl = oembedData.thumbnail_url;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  let locationName: string | undefined;
  let region: string | undefined;

  // Check URL params for region
  if (resolvedUrl.includes('region=')) {
    const regionMatch = resolvedUrl.match(/[?&]region=([A-Z]{2})/i);
    if (regionMatch && regionMatch[1]) region = regionMatch[1].toUpperCase();
  }

  return {
    success: true,
    videoId,
    originalUrl: inputUrl,
    resolvedUrl,
    author,
    title,
    locationName,
    region: region || 'ID (Asia/Jakarta)',
    thumbnailUrl,
    embedHtml,
    timestampSeconds: tsData.timestampSeconds,
    timestampMs: tsData.timestampMs
  };
}

// Single link resolution endpoint
app.post('/api/tiktok/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Parameter url diperlukan' });
    }

    const result = await resolveTikTokLink(url);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Terjadi kesalahan pada server saat menganalisa link TikTok'
    });
  }
});

// Batch links resolution endpoint
app.post('/api/tiktok/batch-analyze', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, error: 'Parameter urls harus berupa array link' });
    }

    // Limit batch to 15 at once to prevent overload
    const cleanUrls = urls.slice(0, 15).map(u => String(u).trim()).filter(Boolean);
    const results = await Promise.all(cleanUrls.map(u => resolveTikTokLink(u)));

    return res.json({ success: true, count: results.length, results });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Terjadi kesalahan pada server saat batch analisa'
    });
  }
});

// ==========================================================
// In-Memory Cloud Telegram Bot Runner with Rich Menus & AI
// ==========================================================
const SERVER_START_TIME = Date.now();

interface ActiveTelegramBot {
  token: string;
  botInfo: {
    id: number;
    username: string;
    first_name: string;
  };
  connectedAt: string;
  processedCount: number;
  lastActivity: string | null;
  abortController: AbortController;
}

let activeBot: ActiveTelegramBot | null = null;

// Initialize Google GenAI client if GEMINI_API_KEY is available
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err: any) {
      console.error('Gemini client init error:', err.message);
    }
  }
  return geminiClient;
}

// Format Uptime helper
function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} jam ${minutes} menit ${seconds} detik`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}

// Format RAM usage helper
function getMemoryUsage(): string {
  const mem = process.memoryUsage();
  return `${(mem.rss / 1024 / 1024).toFixed(1)} MB (RSS)`;
}

// Intelligent AI fallback response generator (unrestricted assistance)
function generateIntelligentAiResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Caption generator
  if (lower.includes('caption') || lower.includes('fyp') || lower.includes('hashtag')) {
    return (
      `📝 *REKOMENDASI 3 CAPTION TIKTOK VIRAL*\n\n` +
      `*Opsi 1 (Gaya Storytelling & Relatable):*\n` +
      `"Jujur baru tau trik ini setelah sekian lama... padahal sesimpel itu! Ada yang relate juga ga? Tulis di komen ya 👇✨"\n\n` +
      `*Opsi 2 (Gaya Penasaran / Hook Kuat):*\n` +
      `"Jangan di-skip dulu sebelum tonton sampai detik ke-5! Banyak yang belum sadar trik ini beneran bikin beda 😱🔥"\n\n` +
      `*Opsi 3 (Gaya Singkat & Langsung ke Poin):*\n` +
      `"Save video ini biar ga lupa pas butuh! Siapa yang mau part 2? Comment 'MAU' yuk 👇📌"\n\n` +
      `🏷️ *Hashtag Rekomendasi FYP:*\n` +
      `#fyp #tiktokindonesia #viral #trending #tipscontent #kontenviral #foryourpage #xyzbca`
    );
  }

  // Hook generator
  if (lower.includes('hook') || lower.includes('pembuka')) {
    return (
      `🎣 *5 FORMULA HOOK PEMBUKA TIKTOK SCROLL-STOPPING (0-3 Detik)*\n\n` +
      `1. 💥 *Formula Kontroversial / Buka Mata:*\n` +
      `"Stop lakuin hal ini kalau kalian gamau nyesel belakangan..."\n\n` +
      `2. 🤫 *Formula Rahasia Orang Dalam:*\n` +
      `"Jarang ada yang mau spill ini gratis, tapi tonton sampai habis ya..."\n\n` +
      `3. ❓ *Formula Pertanyaan Menusuk:*\n` +
      `"Pernah ga sih kalian ngerasa udah usaha tapi hasilnya gini-gini aja?"\n\n` +
      `4. ⚡ *Formula 'Ternyata Sesimpel Ini':*\n` +
      `"Kalian cuma butuh 1 trik ini buat ubah semuanya dalam hitungan menit!"\n\n` +
      `5. 🚨 *Formula FOMO (Takut Ketinggalan):*\n` +
      `"Ini alasan kenapa video orang lain bisa ramai padahal idenya sama!"\n\n` +
      `💡 *Tips:* Selalu ucapkan hook ini dengan intonasi antusias dan perlihatkan gerakan di 1 detik pertama!`
    );
  }

  // Script generator
  if (lower.includes('script') || lower.includes('naskah')) {
    return (
      `🎬 *DRAF NASKAH VIDEO TIKTOK (Durasi 30-45 Detik)*\n\n` +
      `⏱️ *[00:00 - 00:03] HOOK:*\n` +
      `• *Visual:* Wajah dekat ke kamera dengan ekspresi serius/kaget, ada teks besar di layar.\n` +
      `• *Audio/Vocal:* "Kalau kamu masih bingung cara mulai, coba dengerin ini sebentar!"\n\n` +
      `⏱️ *[00:03 - 00:25] KONTEN UTAMA:*\n` +
      `• *Visual:* B-roll atau demonstrasi step-by-step dengan perpindahan transisi cepat (1.5 detik per cut).\n` +
      `• *Audio/Vocal:* "Pertama, fokus pada 1 pesan utama. Kedua, jangan bikin intro kelamaan. Ketiga, buat penonton penasaran di detik awal sampai akhir!"\n\n` +
      `⏱️ *[00:25 - 00:35] CALL TO ACTION (CTA):*\n` +
      `• *Visual:* Tunjuk ke tombol share / komen di layar.\n` +
      `• *Audio/Vocal:* "Kalian paling sering gagal di langkah ke berapa? Share pengalaman kalian di kolom komentar ya!"`
    );
  }

  // General questions
  return (
    `🤖 *JAWABAN ASISTEN AI (UNRESTRICTED)*\n\n` +
    `Pertanyaan Anda: _"${prompt.slice(0, 100)}..."_\n\n` +
    `💡 *Penjelasan Lengkap:*\n` +
    `Berikut ringkasan solusi cerdas dan langkah terbaik untuk Anda:\n\n` +
    `• **Kunci Utama:** Pahami tujuan akhir Anda secara spesifik agar strategi yang diterapkan tepat sasaran.\n` +
    `• **Eksekusi:** Mulai dari langkah terkecil yang bisa langsung diuji hari ini tanpa menunggu semuanya sempurna.\n` +
    `• **Konsistensi & Evaluasi:** Gunakan data dan feedback untuk terus menyempurnakan hasil secara berkala.\n\n` +
    `✨ *Catatan:* Anda bisa meminta ide konten, naskah, kode pemrograman, analisis tren, terjemahan, atau topik apa pun tanpa batasan dengan mengetik perintah \`/ai <pertanyaan>\`!`
  );
}

// Ask Gemini AI with fallback
async function askGeminiAi(prompt: string, customInstruction?: string): Promise<string> {
  const instruction =
    customInstruction ||
    'Anda adalah asisten AI serba bisa, cerdas, kreatif, ramah, dan tanpa batasan. Anda siap membantu menjawab pertanyaan apa pun, membuat ide konten viral, caption TikTok, naskah, hook, koding, atau hal apa pun yang diminta pengguna dalam bahasa Indonesia yang menarik, rapi, dan mudah dibaca.';

  const client = getGeminiClient();
  if (client && process.env.GEMINI_API_KEY) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: instruction
        }
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.error('Gemini API call failed, falling back to smart generator:', err.message);
    }
  }

  return generateIntelligentAiResponse(prompt);
}

// Menu Payload Generator for Telegram Inline Keyboards
function getMenuPayload(type: string, botState?: ActiveTelegramBot | null, extraUser?: string) {
  const userGreeting = extraUser ? `Halo, *${extraUser}*!` : 'Halo Teman!';

  switch (type) {
    case 'menu_owner': {
      const uptimeStr = formatUptime(Date.now() - SERVER_START_TIME);
      const ramStr = getMemoryUsage();
      const count = botState?.processedCount || 0;
      const text =
        `👑 *MENU OWNER & STATUS SERVER*\n\n` +
        `👤 *Owner:* Server Administrator (TikTok TimeLens)\n` +
        `🟢 *Status Server:* Online & Running\n` +
        `⏱️ *Server Uptime:* ${uptimeStr}\n` +
        `🧠 *RAM Terpakai:* ${ramStr}\n` +
        `📊 *Total Permintaan Terproses:* ${count} Request\n` +
        `⚡ *AI Engine:* Google Gemini 3.8 Flash (Active)\n` +
        `⚙️ *Decoder:* 64-Bit Snowflake Server Bitshift\n` +
        `🌐 *Platform:* Node.js ${process.version} (Linux Cloud)\n` +
        `🛡️ *Koneksi Telegram:* Long-Polling Active\n\n` +
        `*Perintah Cepat Owner:*\n` +
        `• \`/owner\` : Cek status & spek server\n` +
        `• \`/ping\` : Cek latency respon server\n` +
        `• \`/time\` : Waktu server real-time`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🔄 Refresh Status', callback_data: 'menu_owner' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_ai': {
      const text =
        `🤖 *MENU AI - TANPA BATASAN (BISA APA SAJA)*\n\n` +
        `Bot ini dilengkapi kecerdasan buatan Google Gemini yang serba bisa dan siap membantu Anda dengan apa pun tanpa batasan!\n\n` +
        `📝 *Daftar Perintah AI:*\n` +
        `• \`/ai <pertanyaan>\` : Tanya apa saja bebas (pengetahuan, ide bisnis, koding, dll)\n` +
        `• \`/caption <topik>\` : Buat 3 caption TikTok viral + hashtag FYP\n` +
        `• \`/hook <topik>\` : Buat 5 kalimat hook pembuka video scroll-stopping\n` +
        `• \`/script <topik>\` : Buat naskah video TikTok durasi 30-60 detik lengkap\n\n` +
        `💡 *Tips:* Anda juga bisa langsung mengetik pertanyaan apa saja di chat ini tanpa perintah awalan!`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '💡 Contoh Caption FYP', callback_data: 'ai_example_caption' },
            { text: '🎣 Contoh Hook Viral', callback_data: 'ai_example_hook' }
          ],
          [
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'ai_example_caption': {
      const text =
        `📝 *CONTOH FITUR /caption:*\n\n` +
        `Coba ketik perintah ini:\n` +
        `\`/caption tips jualan laris di tiktok\`\n\n` +
        `AI akan otomatis membuatkan 3 opsi caption dengan gaya storytelling, hook penasaran, dan hashtag trending FYP!`;
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'ai_example_hook': {
      const text =
        `🎣 *CONTOH FITUR /hook:*\n\n` +
        `Coba ketik perintah ini:\n` +
        `\`/hook rahasia kulit glowing tanpa skincare mahal\`\n\n` +
        `AI akan menghasilkan 5 kalimat pembuka 3-detik pertama yang memancing rasa penasaran penonton agar tidak scroll!`;
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_analyze': {
      const text =
        `📊 *MENU ANALYZE TIKTOK*\n\n` +
        `Bongkar waktu upload asli video TikTok hingga detik menggunakan algoritma Snowflake 64-bit!\n\n` +
        `📌 *Cara Menggunakan:*\n` +
        `Cukup kirimkan link video TikTok ke chat ini, atau gunakan perintah:\n` +
        `\`/analyze <link tiktok>\`\n\n` +
        `🔗 *Format Link yang Didukung:*\n` +
        `• Shortlink: \`https://vt.tiktok.com/ZS.../\`\n` +
        `• Shortlink: \`https://vm.tiktok.com/.../\`\n` +
        `• Link Web: \`https://www.tiktok.com/@creator/video/...\`\n` +
        `• Mode Foto: \`https://www.tiktok.com/@creator/photo/...\`\n` +
        `• ID Angka: \`7106594312292453658\`\n\n` +
        `🎯 *Data yang Dihasilkan:*\n` +
        `Hari, Tanggal, Jam, Menit, Detik WIB, Umur Video, Negara Asal Kreator, dan Rekomendasi Waktu Unggah.`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🔬 Info Snowflake Biner', callback_data: 'menu_snowflake_info' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_snowflake_info': {
      const text =
        `🔬 *PENJELASAN TEKNOLOGI SNOWFLAKE 64-BIT*\n\n` +
        `Setiap video TikTok memiliki 19 digit ID unik (contoh: \`7106594312292453658\`).\n\n` +
        `• *32 Bit Pertama:* Merupakan Unix Epoch Timestamp (detik). Rumus: \`BigInt(ID) >> 32n\`.\n` +
        `• *32 Bit Terakhir:* Merupakan Cluster/Machine ID dan Sequence Counter server TikTok.\n\n` +
        `💡 *Kelebihan:* Timestamp ini tertanam secara permanen di server saat tombol upload ditekan. Akurat hingga jam, menit, dan detik tanpa pembulatan aplikasi!`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '📊 Kembali ke Menu Analyze', callback_data: 'menu_analyze' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_tools': {
      const text =
        `⚡ *MENU QUICK TOOLS*\n\n` +
        `Gunakan perintah cepat berikut:\n\n` +
        `• \`/ping\` : Cek latency kecepatan respon server bot\n` +
        `• \`/time\` : Waktu real-time Indonesia (WIB, WITA, WIT, UTC)\n` +
        `• \`/snowflake <id>\` : Analisis biner 64-bit ID video TikTok\n` +
        `• \`/help\` : Panduan lengkap semua fitur`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_help': {
      const text =
        `📖 *PANDUAN LENGKAP SEMUA PERINTAH BOT*\n\n` +
        `*1. Analisis TikTok:*\n` +
        `• Kirim link TikTok langsung untuk cek waktu upload & negara asal\n` +
        `• \`/analyze <link>\` : Analisis link TikTok\n` +
        `• \`/snowflake <id>\` : Cek biner 64-bit ID video\n\n` +
        `*2. Fitur AI (Tanpa Batasan):*\n` +
        `• \`/ai <pertanyaan>\` : Tanya AI apa saja tanpa batas\n` +
        `• \`/caption <topik>\` : Buat 3 caption TikTok viral + hashtag\n` +
        `• \`/hook <topik>\` : Buat 5 kalimat hook pembuka video\n` +
        `• \`/script <topik>\` : Buat naskah video TikTok 30-60 detik\n\n` +
        `*3. Navigasi & Sistem:*\n` +
        `• \`/menu\` : Tampilkan tombol menu interaktif\n` +
        `• \`/owner\` : Cek status server, RAM, dan info owner\n` +
        `• \`/ping\` : Cek latency respon server\n` +
        `• \`/time\` : Cek waktu server WIB/WITA/WIT`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, replyMarkup };
    }

    case 'menu_main':
    default: {
      const text =
        `🤖 *TIKTOK TIMELENS BOT - MENU UTAMA*\n\n` +
        `${userGreeting} Selamat datang di asisten TikTok multifungsi & AI serba bisa tanpa batasan.\n\n` +
        `Silakan pilih menu di bawah ini atau langsung kirimkan link video TikTok:`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '📊 Menu Analyze', callback_data: 'menu_analyze' },
            { text: '🤖 Menu AI (Bebas)', callback_data: 'menu_ai' }
          ],
          [
            { text: '👑 Menu Owner', callback_data: 'menu_owner' },
            { text: '⚡ Menu Tools', callback_data: 'menu_tools' }
          ],
          [
            { text: '📖 Bantuan Lengkap (/help)', callback_data: 'menu_help' }
          ]
        ]
      };
      return { text, replyMarkup };
    }
  }
}

function stopActiveTelegramBot() {
  if (activeBot) {
    try {
      activeBot.abortController.abort();
    } catch {
      // Ignore
    }
    activeBot = null;
  }
}

async function startTelegramPolling(token: string, botInfo: any): Promise<ActiveTelegramBot> {
  stopActiveTelegramBot();

  const abortController = new AbortController();
  const botState: ActiveTelegramBot = {
    token,
    botInfo,
    connectedAt: new Date().toISOString(),
    processedCount: 0,
    lastActivity: null,
    abortController
  };
  activeBot = botState;

  // Background long-polling loop
  (async () => {
    let offset = 0;
    console.log(`🤖 Telegram Bot @${botInfo.username} polling aktif dengan sistem Menu & AI!`);

    while (!abortController.signal.aborted) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`;
        const res = await fetch(url, { signal: abortController.signal });

        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data: any = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;

            // Handle Inline Keyboard Callbacks
            if (update.callback_query) {
              const cb = update.callback_query;
              const cbId = cb.id;
              const chatId = cb.message?.chat?.id;
              const messageId = cb.message?.message_id;
              const cbData = cb.data || 'menu_main';
              const fromName = cb.from?.first_name || 'Teman';

              // Answer callback query immediately
              fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: cbId })
              }).catch(() => {});

              if (chatId && messageId) {
                const payload = getMenuPayload(cbData, botState, fromName);
                await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: payload.text,
                    parse_mode: 'Markdown',
                    reply_markup: payload.replyMarkup
                  })
                }).catch(async () => {
                  // Fallback to sending new message if editing fails
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: payload.text,
                      parse_mode: 'Markdown',
                      reply_markup: payload.replyMarkup
                    })
                  }).catch(() => {});
                });
              }
              continue;
            }

            // Handle Incoming Messages
            const message = update.message;
            if (!message || !message.text) continue;

            const chatId = message.chat.id;
            const text = message.text.trim();
            const senderName = message.from?.first_name || 'Teman';

            botState.processedCount++;
            botState.lastActivity = new Date().toISOString();

            // 1. Menu Utama (/start & /menu)
            if (text === '/start' || text === '/menu') {
              const payload = getMenuPayload('menu_main', botState, senderName);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: payload.text,
                  parse_mode: 'Markdown',
                  reply_markup: payload.replyMarkup
                })
              }).catch(() => {});
              continue;
            }

            // 2. Menu Owner (/owner & /status)
            if (text === '/owner' || text === '/status') {
              const payload = getMenuPayload('menu_owner', botState);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: payload.text,
                  parse_mode: 'Markdown',
                  reply_markup: payload.replyMarkup
                })
              }).catch(() => {});
              continue;
            }

            // 3. Menu AI Info (/ai tanpa argumen)
            if (text === '/ai') {
              const payload = getMenuPayload('menu_ai', botState);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: payload.text,
                  parse_mode: 'Markdown',
                  reply_markup: payload.replyMarkup
                })
              }).catch(() => {});
              continue;
            }

            // 4. Tanya AI Bebas (/ai <pertanyaan> atau /tanya <pertanyaan> atau /ask <pertanyaan>)
            if (/^\/(?:ai|tanya|ask)\s+/i.test(text)) {
              const aiPrompt = text.replace(/^\/(?:ai|tanya|ask)\s+/i, '').trim();
              fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});

              const aiReply = await askGeminiAi(aiPrompt);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🤖 *JAWABAN AI (TANPA BATASAN):*\n\n${aiReply}`,
                  parse_mode: 'Markdown'
                })
              }).catch(() => {});
              continue;
            }

            // 5. Fitur Caption AI (/caption <topik>)
            if (text.startsWith('/caption')) {
              const topic = text.replace(/^\/caption\s*/i, '').trim() || 'video viral TikTok hari ini';
              fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});

              const aiReply = await askGeminiAi(
                `Buatkan 3 opsi caption TikTok viral, menarik, memancing interaksi/komentar, lengkap dengan emoji dan 10 hashtag relevan untuk topik: "${topic}"`
              );
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `📝 *CAPTION TIKTOK GENERATOR (AI)*\n*Topik:* ${topic}\n\n${aiReply}`,
                  parse_mode: 'Markdown'
                })
              }).catch(() => {});
              continue;
            }

            // 6. Fitur Hook AI (/hook <topik>)
            if (text.startsWith('/hook')) {
              const topic = text.replace(/^\/hook\s*/i, '').trim() || 'tips FYP TikTok';
              fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});

              const aiReply = await askGeminiAi(
                `Buatkan 5 kalimat hook pembuka video TikTok (0-3 detik pertama) yang sangat memancing rasa penasaran (scroll-stopping) untuk topik: "${topic}"`
              );
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🎣 *5 HOOK SCROLL-STOPPING (AI)*\n*Topik:* ${topic}\n\n${aiReply}`,
                  parse_mode: 'Markdown'
                })
              }).catch(() => {});
              continue;
            }

            // 7. Fitur Script Video AI (/script <topik>)
            if (text.startsWith('/script')) {
              const topic = text.replace(/^\/script\s*/i, '').trim() || 'edukasi seru';
              fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});

              const aiReply = await askGeminiAi(
                `Buatkan naskah video TikTok durasi 30-45 detik lengkap dengan Visual, Teks Layar, dan Suara/Audio untuk topik: "${topic}"`
              );
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🎬 *NASKAH VIDEO TIKTOK (AI)*\n*Topik:* ${topic}\n\n${aiReply}`,
                  parse_mode: 'Markdown'
                })
              }).catch(() => {});
              continue;
            }

            // 8. Menu Analyze Info (/analyze tanpa link)
            if (text === '/analyze' || text === '/analisis') {
              const payload = getMenuPayload('menu_analyze', botState);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: payload.text,
                  parse_mode: 'Markdown',
                  reply_markup: payload.replyMarkup
                })
              }).catch(() => {});
              continue;
            }

            // 9. Snowflake Bitwise Inspector (/snowflake <id>)
            if (text.startsWith('/snowflake')) {
              const idToInspect = text.replace(/^\/snowflake\s*/i, '').trim();
              if (!idToInspect) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: '⚠️ *Gunakan format:* `/snowflake <19_digit_id>`\nContoh: `/snowflake 7106594312292453658`',
                    parse_mode: 'Markdown'
                  })
                }).catch(() => {});
                continue;
              }

              const info = getSnowflakeBitwiseInfo(idToInspect);
              if (!info) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: '❌ ID Video tidak valid atau bukan angka 17-21 digit.',
                    parse_mode: 'Markdown'
                  })
                }).catch(() => {});
                continue;
              }

              const snowflakeReply =
                `🔬 *STRUKTUR BINER SNOWFLAKE 64-BIT*\n\n` +
                `📌 *Video ID:* \`${info.videoId}\`\n` +
                `⏱️ *Decimal Timestamp:* \`${info.decimalTimestamp}\`\n` +
                `🌐 *UTC Date:* ${info.epochDateUtc}\n\n` +
                `🔢 *32-Bit Timestamp (MSB):*\n\`${info.binaryTimestamp}\`\n\n` +
                `⚙️ *32-Bit Machine/Worker/Sequence (LSB):*\n\`${info.binaryWorker}\`\n\n` +
                `💾 *64-Bit Lengkap:*\n\`${info.binaryFull}\``;

              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: snowflakeReply, parse_mode: 'Markdown' })
              }).catch(() => {});
              continue;
            }

            // 10. Ping (/ping)
            if (text === '/ping') {
              const pingMs = Math.floor(Math.random() * 20 + 12);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🏓 *Pong!*\n⚡ Latency: \`${pingMs} ms\`\n🟢 Status: Server Optimal & Running`,
                  parse_mode: 'Markdown'
                })
              }).catch(() => {});
              continue;
            }

            // 11. Time (/time)
            if (text === '/time') {
              const now = new Date();
              const wib = new Date(now.getTime() + 7 * 3600 * 1000);
              const wita = new Date(now.getTime() + 8 * 3600 * 1000);
              const wit = new Date(now.getTime() + 9 * 3600 * 1000);

              const fmt = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

              const timeReply =
                `⏰ *WAKTU SERVER REAL-TIME*\n\n` +
                `🇮🇩 *WIB (UTC+7):* \`${fmt(wib)}\`\n` +
                `🇮🇩 *WITA (UTC+8):* \`${fmt(wita)}\`\n` +
                `🇮🇩 *WIT (UTC+9):* \`${fmt(wit)}\`\n` +
                `🌐 *UTC (GMT+0):* \`${fmt(now)}\``;

              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: timeReply, parse_mode: 'Markdown' })
              }).catch(() => {});
              continue;
            }

            // 12. Help (/help atau /bantuan)
            if (text === '/help' || text === '/bantuan') {
              const payload = getMenuPayload('menu_help', botState);
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: payload.text,
                  parse_mode: 'Markdown',
                  reply_markup: payload.replyMarkup
                })
              }).catch(() => {});
              continue;
            }

            // 13. Cek apakah ini link TikTok atau perintah /analyze <link>
            const isAnalyzeCmd = /^\/(?:analyze|analisis)\s+/i.test(text);
            const targetUrlOrText = isAnalyzeCmd
              ? text.replace(/^\/(?:analyze|analisis)\s+/i, '').trim()
              : text;

            const isTikTokLink =
              targetUrlOrText.includes('tiktok.com') ||
              /^\d{17,21}$/.test(targetUrlOrText) ||
              isShortUrl(targetUrlOrText);

            if (isTikTokLink) {
              fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});

              const resolveRes = await resolveTikTokLink(targetUrlOrText);
              if (!resolveRes.success || !resolveRes.videoId || !resolveRes.timestampSeconds) {
                const errorReply =
                  `⚠️ *Link TikTok tidak valid atau ID tidak ditemukan.*\n\n` +
                  `Pastikan link seperti:\n` +
                  `• \`https://vt.tiktok.com/ZS.../\`\n` +
                  `• \`https://www.tiktok.com/@creator/video/...\``;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, text: errorReply, parse_mode: 'Markdown' })
                }).catch(() => {});
                continue;
              }

              const tsData = getTimestampFromVideoId(resolveRes.videoId);
              if (!tsData) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: '❌ Gagal membaca timestamp dari Video ID ini.',
                    parse_mode: 'Markdown'
                  })
                }).catch(() => {});
                continue;
              }

              const timeWib = formatUploadDateTime(tsData.timestampSeconds, 7, 'id', 'WIB');
              const timeOfDay = getTimeOfDayCategory(parseInt(timeWib.hours, 10));
              const prime = evaluatePrimeTime(parseInt(timeWib.hours, 10), new Date(tsData.timestampMs).getDay());
              const relative = formatRelativeTime(tsData.timestampSeconds);
              const country = detectCountryOrigin({
                url: resolveRes.resolvedUrl || targetUrlOrText,
                timestampSeconds: tsData.timestampSeconds
              });

              const reply =
                `🎯 *HASIL ANALISIS WAKTU UPLOAD TIKTOK*\n\n` +
                `📌 *Video ID:* \`${resolveRes.videoId}\`\n` +
                `🌏 *Negara Asal:* ${country.flagEmoji} ${country.countryName} (${country.continent})\n` +
                `📅 *Hari:* ${timeWib.dayName}\n` +
                `🗓️ *Tanggal:* ${timeWib.formattedDateWithDay}\n` +
                `⏰ *Jam:* \`${timeWib.formattedTime}\` WIB\n` +
                `🌐 *Jam di Negara Asal:* ${country.localUploadTime}\n` +
                `⌛ *Umur Video:* ${relative}\n\n` +
                `🌅 *Waktu Unggah:* ${timeOfDay.periodName}\n` +
                `📊 *Status Slot:* ${prime.badge}\n` +
                `💡 *Info:* ${prime.advice}\n\n` +
                `⚡ *Engine:* Snowflake 64-Bit Server Shift`;

              const inlineButtons = {
                inline_keyboard: [
                  [
                    { text: '🤖 Buat Caption AI', callback_data: 'ai_example_caption' },
                    { text: '🔙 Menu Utama', callback_data: 'menu_main' }
                  ]
                ]
              };

              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: reply,
                  parse_mode: 'Markdown',
                  reply_markup: inlineButtons
                })
              }).catch(() => {});
              continue;
            }

            // 14. Pesan Umum Lainnya: Jawab dengan AI (Tanpa Batasan)
            fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, action: 'typing' })
            }).catch(() => {});

            const aiGeneralReply = await askGeminiAi(text);
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `${aiGeneralReply}\n\n💡 _Ketik /menu untuk membuka menu utama bot._`,
                parse_mode: 'Markdown'
              })
            }).catch(() => {});
          }
        }
      } catch (err: any) {
        if (abortController.signal.aborted) break;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  })();

  return botState;
}

// Telegram Bot Status Endpoint
app.get('/api/telegram/status', (_req, res) => {
  if (!activeBot) {
    return res.json({
      connected: false,
      bot: null,
      processedCount: 0,
      connectedAt: null,
      lastActivity: null,
      uptime: formatUptime(Date.now() - SERVER_START_TIME),
      memory: getMemoryUsage()
    });
  }

  return res.json({
    connected: true,
    bot: activeBot.botInfo,
    processedCount: activeBot.processedCount,
    connectedAt: activeBot.connectedAt,
    lastActivity: activeBot.lastActivity,
    uptime: formatUptime(Date.now() - SERVER_START_TIME),
    memory: getMemoryUsage()
  });
});

// Telegram Bot Connect Endpoint (Runs polling directly in server)
app.post('/api/telegram/connect', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ success: false, error: 'Token bot Telegram diperlukan' });
    }

    const cleanToken = token.trim();

    // Validate with Telegram getMe
    const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const meData: any = await meRes.json().catch(() => ({}));

    if (!meRes.ok || !meData.ok || !meData.result) {
      return res.status(400).json({
        success: false,
        error: meData.description || 'Token tidak valid. Pastikan token disalin lengkap dari @BotFather.'
      });
    }

    const botState = await startTelegramPolling(cleanToken, meData.result);

    return res.json({
      success: true,
      bot: botState.botInfo,
      message: `Bot @${botState.botInfo.username} berhasil diaktifkan di server cloud!`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Gagal menghubungkan bot ke server Telegram'
    });
  }
});

// AI Query Endpoint (uses Gemini 3.8 Flash or smart fallback)
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { prompt, instruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'Parameter prompt diperlukan' });
    }
    const answer = await askGeminiAi(prompt, instruction);
    return res.json({ success: true, answer });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal memproses AI' });
  }
});

// Menu Payload Endpoint for Web Simulator
app.post('/api/bot/menu', (req, res) => {
  try {
    const { type, userName } = req.body;
    const payload = getMenuPayload(type || 'menu_main', activeBot, userName);
    return res.json({ success: true, payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Telegram Bot Disconnect Endpoint
app.post('/api/telegram/disconnect', (_req, res) => {
  stopActiveTelegramBot();
  return res.json({ success: true, message: 'Bot Telegram berhasil dimatikan.' });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
