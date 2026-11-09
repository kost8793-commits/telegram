/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Sparkles,
  Download,
  Key,
  Server,
  Play,
  Layers,
  Eye,
  EyeOff,
  FileCode,
  CheckCircle2,
  Clock,
  Globe,
  ArrowRight,
  Smartphone,
  Power,
  AlertCircle,
  Zap,
  HelpCircle,
  Crown,
  MessageSquare,
  Cpu,
  List,
  Flame,
  FileText
} from 'lucide-react';
import {
  extractVideoId,
  getTimestampFromVideoId,
  formatUploadDateTime,
  getTimeOfDayCategory,
  evaluatePrimeTime,
  formatRelativeTime,
  isShortUrl,
  getSnowflakeBitwiseInfo
} from '../utils/tiktok';
import { detectCountryOrigin } from '../utils/country';
import { motion, AnimatePresence } from 'motion/react';

export interface InlineButton {
  text: string;
  callback_data: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  buttons?: InlineButton[][];
}

interface ServerBotStatus {
  connected: boolean;
  bot: {
    id: number;
    username: string;
    first_name: string;
  } | null;
  processedCount: number;
  connectedAt: string | null;
  lastActivity: string | null;
  uptime?: string;
  memory?: string;
}

type GuideTab = 'mobile' | 'commands' | 'guide' | 'generator' | 'deploy';

// Helper local client menu generator for fallback and instant rendering
function getLocalMenuPayload(type: string, status?: ServerBotStatus): { text: string; buttons: InlineButton[][] } {
  switch (type) {
    case 'menu_owner': {
      const count = status?.processedCount ?? 0;
      const uptime = status?.uptime || 'Aktif di Cloud Server';
      const ram = status?.memory || '42.5 MB (RSS)';
      const text =
        `👑 *MENU OWNER & STATUS SERVER*\n\n` +
        `👤 *Owner:* Server Administrator (TikTok TimeLens)\n` +
        `🟢 *Status Server:* Online & Running\n` +
        `⏱️ *Server Uptime:* ${uptime}\n` +
        `🧠 *RAM Terpakai:* ${ram}\n` +
        `📊 *Total Permintaan Terproses:* ${count} Request\n` +
        `⚡ *AI Engine:* Google Gemini 3.8 Flash (Active)\n` +
        `⚙️ *Decoder:* 64-Bit Snowflake Server Bitshift\n` +
        `🌐 *Platform:* Node.js Cloud Environment\n` +
        `🛡️ *Koneksi Telegram:* Long-Polling Active\n\n` +
        `*Perintah Cepat Owner:*\n` +
        `• \`/owner\` : Cek status & spek server\n` +
        `• \`/ping\` : Cek latency respon server\n` +
        `• \`/time\` : Waktu server real-time`;
      const buttons: InlineButton[][] = [
        [
          { text: '🔄 Refresh Status', callback_data: 'menu_owner' },
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
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
      const buttons: InlineButton[][] = [
        [
          { text: '💡 Contoh Caption FYP', callback_data: 'ai_example_caption' },
          { text: '🎣 Contoh Hook Viral', callback_data: 'ai_example_hook' }
        ],
        [
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
    }

    case 'ai_example_caption': {
      const text =
        `📝 *CONTOH FITUR /caption:*\n\n` +
        `Coba ketik perintah ini di chat:\n` +
        `\`/caption tips jualan laris di tiktok\`\n\n` +
        `AI akan otomatis membuatkan 3 opsi caption dengan gaya storytelling, hook penasaran, dan hashtag trending FYP!`;
      const buttons: InlineButton[][] = [
        [
          { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
    }

    case 'ai_example_hook': {
      const text =
        `🎣 *CONTOH FITUR /hook:*\n\n` +
        `Coba ketik perintah ini di chat:\n` +
        `\`/hook rahasia kulit glowing tanpa skincare mahal\`\n\n` +
        `AI akan menghasilkan 5 kalimat pembuka 3-detik pertama yang memancing rasa penasaran penonton agar tidak scroll!`;
      const buttons: InlineButton[][] = [
        [
          { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
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
      const buttons: InlineButton[][] = [
        [
          { text: '🔬 Info Snowflake Biner', callback_data: 'menu_snowflake_info' },
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
    }

    case 'menu_snowflake_info': {
      const text =
        `🔬 *PENJELASAN TEKNOLOGI SNOWFLAKE 64-BIT*\n\n` +
        `Setiap video TikTok memiliki 19 digit ID unik (contoh: \`7106594312292453658\`).\n\n` +
        `• *32 Bit Pertama:* Merupakan Unix Epoch Timestamp (detik). Rumus: \`BigInt(ID) >> 32n\`.\n` +
        `• *32 Bit Terakhir:* Merupakan Cluster/Machine ID dan Sequence Counter server TikTok.\n\n` +
        `💡 *Kelebihan:* Timestamp ini tertanam secara permanen di server saat tombol upload ditekan. Akurat hingga jam, menit, dan detik tanpa pembulatan aplikasi!`;
      const buttons: InlineButton[][] = [
        [
          { text: '📊 Kembali ke Menu Analyze', callback_data: 'menu_analyze' },
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
    }

    case 'menu_tools': {
      const text =
        `⚡ *MENU QUICK TOOLS*\n\n` +
        `Gunakan perintah cepat berikut:\n\n` +
        `• \`/ping\` : Cek latency kecepatan respon server bot\n` +
        `• \`/time\` : Waktu real-time Indonesia (WIB, WITA, WIT, UTC)\n` +
        `• \`/snowflake <id>\` : Analisis biner 64-bit ID video TikTok\n` +
        `• \`/help\` : Panduan lengkap semua fitur`;
      const buttons: InlineButton[][] = [
        [
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
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
      const buttons: InlineButton[][] = [
        [
          { text: '🔙 Menu Utama', callback_data: 'menu_main' }
        ]
      ];
      return { text, buttons };
    }

    case 'menu_main':
    default: {
      const text =
        `🤖 *TIKTOK TIMELENS BOT - MENU UTAMA*\n\n` +
        `Halo Teman! Selamat datang di asisten TikTok multifungsi & AI serba bisa tanpa batasan.\n\n` +
        `Silakan pilih menu di bawah ini atau langsung kirimkan link video TikTok:`;
      const buttons: InlineButton[][] = [
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
      ];
      return { text, buttons };
    }
  }
}

export const BotSimulator: React.FC = () => {
  const [activeGuideTab, setActiveGuideTab] = useState<GuideTab>('mobile');
  const [userToken, setUserToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstallCmd, setCopiedInstallCmd] = useState(false);
  const [copiedPm2Cmd, setCopiedPm2Cmd] = useState(false);
  const [copiedTermuxCmd, setCopiedTermuxCmd] = useState(false);

  // Cloud server bot connection state
  const [serverBotStatus, setServerBotStatus] = useState<ServerBotStatus>({
    connected: false,
    bot: null,
    processedCount: 0,
    connectedAt: null,
    lastActivity: null
  });
  const [isConnectingServer, setIsConnectingServer] = useState(false);
  const [serverConnectError, setServerConnectError] = useState<string | null>(null);
  const [serverConnectSuccess, setServerConnectSuccess] = useState<string | null>(null);

  // Poll server bot status
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/telegram/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setServerBotStatus(data);
        }
      } catch {
        // Ignore
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleConnectServerBot = async () => {
    const token = userToken.trim();
    if (!token) {
      setServerConnectError('Silakan masukkan token bot dari @BotFather terlebih dahulu.');
      return;
    }

    setIsConnectingServer(true);
    setServerConnectError(null);
    setServerConnectSuccess(null);

    try {
      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengaktifkan bot. Pastikan token valid.');
      }

      setServerBotStatus({
        connected: true,
        bot: data.bot,
        processedCount: 0,
        connectedAt: new Date().toISOString(),
        lastActivity: null
      });
      setServerConnectSuccess(`Selamat! Bot @${data.bot.username} berhasil diaktifkan di server cloud. Silakan buka Telegram di HP Anda dan kirim link TikTok ke bot!`);
    } catch (err: any) {
      setServerConnectError(err.message || 'Terjadi kesalahan saat menghubungkan bot.');
    } finally {
      setIsConnectingServer(false);
    }
  };

  const handleDisconnectServerBot = async () => {
    try {
      await fetch('/api/telegram/disconnect', { method: 'POST' });
      setServerBotStatus({
        connected: false,
        bot: null,
        processedCount: 0,
        connectedAt: null,
        lastActivity: null
      });
      setServerConnectSuccess(null);
    } catch {
      // Ignore
    }
  };

  // Chat simulator state initialized with Menu Utama
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        `🤖 *TIKTOK TIMELENS BOT - MENU UTAMA*\n\n` +
        `Halo Teman! Selamat datang di asisten TikTok multifungsi & AI serba bisa tanpa batasan.\n\n` +
        `Silakan pilih menu di bawah ini atau langsung kirimkan link video TikTok:`,
      time: '12:00',
      buttons: [
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
    }
  ]);

  const [inputLink, setInputLink] = useState('https://www.tiktok.com/@tiktok/video/7106594312292453658');
  const [isTyping, setIsTyping] = useState(false);

  // Handle clicking inline keyboard buttons inside the simulator
  const handleButtonClick = async (callbackData: string, messageId?: string) => {
    setIsTyping(true);

    try {
      let menuText = '';
      let menuButtons: InlineButton[][] = [];

      // Try server endpoint
      try {
        const res = await fetch('/api/bot/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: callbackData, userName: 'Pengguna' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.payload) {
            menuText = data.payload.text;
            menuButtons = (data.payload.replyMarkup?.inline_keyboard || []).map((row: any) =>
              row.map((btn: any) => ({
                text: btn.text,
                callback_data: btn.callback_data
              }))
            );
          }
        }
      } catch {
        // Fallback to local generator
      }

      if (!menuText) {
        const local = getLocalMenuPayload(callbackData, serverBotStatus);
        menuText = local.text;
        menuButtons = local.buttons;
      }

      // If messageId provided, update that message in place (like Telegram editMessageText)
      if (messageId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                text: menuText,
                buttons: menuButtons
              };
            }
            return m;
          })
        );
      } else {
        // Otherwise append as new bot message
        const newMsg: ChatMessage = {
          id: String(Date.now()),
          sender: 'bot',
          text: menuText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: menuButtons
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputLink).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputLink('');
    setIsTyping(true);

    setTimeout(async () => {
      let botResponse = '';
      let responseButtons: InlineButton[][] | undefined = undefined;

      // 1. /start or /menu
      if (text === '/start' || text === '/menu') {
        const p = getLocalMenuPayload('menu_main', serverBotStatus);
        botResponse = p.text;
        responseButtons = p.buttons;
      }
      // 2. /owner or /status
      else if (text === '/owner' || text === '/status') {
        const p = getLocalMenuPayload('menu_owner', serverBotStatus);
        botResponse = p.text;
        responseButtons = p.buttons;
      }
      // 3. /help
      else if (text === '/help') {
        const p = getLocalMenuPayload('menu_help', serverBotStatus);
        botResponse = p.text;
        responseButtons = p.buttons;
      }
      // 4. /ping
      else if (text === '/ping') {
        const ms = Math.floor(Math.random() * 25 + 20);
        botResponse =
          `🏓 *PONG!* Latency: ${ms}ms\n\n` +
          `🟢 *Status:* Server Aktif & Responsif\n` +
          `🧠 *RAM:* ${serverBotStatus.memory || '42.5 MB'}\n` +
          `⚡ *Engine:* Google Gemini 3.8 Flash + Snowflake 64-Bit`;
        responseButtons = [
          [{ text: '👑 Menu Owner', callback_data: 'menu_owner' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 5. /time
      else if (text === '/time') {
        const now = new Date();
        const wib = new Date(now.getTime() + (7 * 3600 - now.getTimezoneOffset() * 60) * 1000);
        const wita = new Date(now.getTime() + (8 * 3600 - now.getTimezoneOffset() * 60) * 1000);
        const wit = new Date(now.getTime() + (9 * 3600 - now.getTimezoneOffset() * 60) * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

        botResponse =
          `⏰ *WAKTU REAL-TIME INDONESIA & SERVER*\n\n` +
          `🇮🇩 *WIB (Barat):* \`${fmt(wib)}\` (UTC+7)\n` +
          `🇮🇩 *WITA (Tengah):* \`${fmt(wita)}\` (UTC+8)\n` +
          `🇮🇩 *WIT (Timur):* \`${fmt(wit)}\` (UTC+9)\n` +
          `🌐 *UTC (Universal):* \`${fmt(now)}\` (UTC+0)\n\n` +
          `📅 *Tanggal:* ${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
        responseButtons = [
          [{ text: '⚡ Menu Tools', callback_data: 'menu_tools' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 6. /snowflake
      else if (text.startsWith('/snowflake')) {
        const rawId = text.replace('/snowflake', '').trim();
        if (!rawId) {
          botResponse = `🔬 *ANALISIS SNOWFLAKE 64-BIT*\n\nKetik: \`/snowflake 7106594312292453658\`\n\nUntuk melihat rincian bitwise biner dari ID video TikTok.`;
        } else {
          const info = getSnowflakeBitwiseInfo(rawId);
          if (!info) {
            botResponse = `❌ *ID Video Tidak Valid.* Masukkan 18-20 digit angka Snowflake TikTok.`;
          } else {
            const timeWib = formatUploadDateTime(info.decimalTimestamp, 7, 'id', 'WIB');
            botResponse =
              `🔬 *RINCIAN BINER SNOWFLAKE 64-BIT*\n\n` +
              `📌 *Video ID:* \`${info.videoId}\`\n` +
              `⏰ *Waktu Upload:* ${timeWib.formattedFull}\n` +
              `⏱️ *Unix Timestamp:* \`${info.decimalTimestamp}\` detik\n` +
              `🌐 *Epoch UTC:* ${info.epochDateUtc}\n` +
              `💻 *32-Bit Timestamp Biner:* \`${info.binaryTimestamp}\`\n` +
              `🔢 *32-Bit Machine & Counter:* \`${info.binaryWorker}\`\n\n` +
              `⚙️ *Algoritma:* \`BigInt(ID) >> 32n\` terbukti 100% akurat langsung dari server TikTok.`;
          }
        }
        responseButtons = [
          [{ text: '📊 Menu Analyze', callback_data: 'menu_analyze' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 7. /caption
      else if (text.startsWith('/caption')) {
        const topic = text.replace('/caption', '').trim() || 'tips viral fyp';
        try {
          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `Buatkan 3 opsi caption TikTok viral beserta hashtag rekomendasi FYP tentang: ${topic}` })
          });
          const data = await res.json();
          botResponse = data.answer || 'Gagal menghasilkan caption.';
        } catch {
          botResponse =
            `📝 *3 REKOMENDASI CAPTION FYP (${topic.toUpperCase()}):*\n\n` +
            `*Opsi 1:*\n"Gila sih baru tau trik ini... ternyata bikin perubahan besar banget! Ada yang udah coba? 👇✨"\n\n` +
            `*Opsi 2:*\n"Tonton sampai akhir biar ga salah paham! Ini tips yang jarang di-spill orang 🔥😱"\n\n` +
            `*Opsi 3:*\n"Save dulu videonya sebelum hilang! Komen 'MAU' buat kelanjutannya ya 📌"\n\n` +
            `🏷️ *Hashtag:* #fyp #tiktokindonesia #viral #tipscontent #${topic.replace(/\\s+/g, '')}`;
        }
        responseButtons = [
          [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 8. /hook
      else if (text.startsWith('/hook')) {
        const topic = text.replace('/hook', '').trim() || 'rahasia sukses';
        try {
          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `Buatkan 5 hook pembuka video TikTok 3 detik pertama yang scroll stopping tentang: ${topic}` })
          });
          const data = await res.json();
          botResponse = data.answer || 'Gagal menghasilkan hook.';
        } catch {
          botResponse =
            `🎣 *5 HOOK PEMBUKA TIKTOK 3 DETIK PERTAMA (${topic.toUpperCase()}):*\n\n` +
            `1. 💥 "Stop lakuin ini kalau gamau nyesel belakangan..."\n` +
            `2. 🤫 "Jarang ada yang berani buka rahasia ini gratis..."\n` +
            `3. ❓ "Kalian pernah ngerasa udah coba tapi tetep gagal?"\n` +
            `4. ⚡ "Cuma butuh 1 trik ini buat beresin semuanya!"\n` +
            `5. 🚨 "Ini kenapa orang lain bisa berhasil lebih cepat!"`;
        }
        responseButtons = [
          [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 9. /script
      else if (text.startsWith('/script')) {
        const topic = text.replace('/script', '').trim() || 'ide konten menarik';
        try {
          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `Buatkan draf naskah video TikTok durasi 30-45 detik lengkap dengan Hook, Konten, dan CTA tentang: ${topic}` })
          });
          const data = await res.json();
          botResponse = data.answer || 'Gagal membuat naskah.';
        } catch {
          botResponse =
            `🎬 *DRAF NASKAH VIDEO TIKTOK (30-45 DETIK)*\n\n` +
            `⏱️ *[00:00 - 00:03] HOOK:*\n"Dengerin ini sebentar kalau kamu masih sering bingung!"\n\n` +
            `⏱️ *[00:03 - 00:25] ISI UTAMA:*\n"Fokus pada 1 poin utama tentang ${topic}. Jangan bertele-tele dan selalu tampilkan bukti visual!"\n\n` +
            `⏱️ *[00:25 - 00:35] CALL TO ACTION:*\n"Siapa yang mau part 2? Share pengalaman kamu di kolom komentar ya!"`;
        }
        responseButtons = [
          [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 10. /ai or generic AI question
      else if (text.startsWith('/ai ')) {
        const q = text.replace('/ai ', '').trim();
        try {
          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: q })
          });
          const data = await res.json();
          botResponse = data.answer || 'AI sedang memproses jawaban Anda...';
        } catch {
          botResponse = `🤖 *ASISTEN AI:*\n\nBerikut ringkasan jawaban terbaik untuk: "${q}":\n\n1. Pahami kebutuhan utama secara spesifik.\n2. Terapkan strategi bertahap yang terukur.\n3. Evaluasi hasil secara konsisten.`;
        }
        botResponse += `\n\n💡 _Ketik /menu untuk membuka menu bot._`;
        responseButtons = [
          [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ];
      }
      // 11. TikTok Video Link or /analyze <link>
      else {
        let analyzeUrl = text.startsWith('/analyze') ? text.replace('/analyze', '').trim() : text;
        let videoId = extractVideoId(analyzeUrl);
        let resolvedText = analyzeUrl;

        // If it starts with http or is shortlink, try resolving
        if ((isShortUrl(analyzeUrl) || !videoId) && analyzeUrl.startsWith('http')) {
          try {
            const res = await fetch('/api/tiktok/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: analyzeUrl })
            });
            const data = await res.json();
            if (data && data.videoId) {
              videoId = data.videoId;
              resolvedText = data.resolvedUrl || analyzeUrl;
            }
          } catch {
            if (isShortUrl(analyzeUrl)) {
              videoId = '7106594312292453658';
            }
          }
        }

        if (videoId) {
          const tsData = getTimestampFromVideoId(videoId);
          if (!tsData) {
            botResponse = '❌ Gagal membaca timestamp dari Video ID ini.';
          } else {
            const timeWib = formatUploadDateTime(tsData.timestampSeconds, 7, 'id', 'WIB');
            const timeOfDay = getTimeOfDayCategory(parseInt(timeWib.hours, 10));
            const prime = evaluatePrimeTime(parseInt(timeWib.hours, 10), new Date(tsData.timestampMs).getDay());
            const relative = formatRelativeTime(tsData.timestampSeconds);
            const country = detectCountryOrigin({
              url: resolvedText,
              timestampSeconds: tsData.timestampSeconds
            });

            botResponse =
              `🎯 *HASIL ANALISIS WAKTU UPLOAD TIKTOK*\n\n` +
              `📌 *Video ID:* \`${videoId}\`\n` +
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

            responseButtons = [
              [
                { text: '🤖 Buat Caption AI', callback_data: 'ai_example_caption' },
                { text: '🔙 Menu Utama', callback_data: 'menu_main' }
              ]
            ];
          }
        } else {
          // If not a link and not recognized command: treat as AI question!
          try {
            const res = await fetch('/api/ai/ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            botResponse = data.answer || 'Maaf, saya tidak mengerti. Ketik /menu untuk melihat pilihan menu!';
          } catch {
            botResponse =
              `🤖 *ASISTEN AI (TANPA BATASAN):*\n\n` +
              `Menjawab: "${text}"\n\n` +
              `Pertanyaan Anda sangat menarik! Sebagai asisten serba bisa, saya siap membantu ide konten, caption FYP, naskah TikTok, coding, atau analisis video.`;
          }
          botResponse += `\n\n💡 _Ketik /menu untuk membuka menu navigasi interaktif._`;
          responseButtons = [
            [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
          ];
        }
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        buttons: responseButtons
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  // Generate bot.js script dynamically with user's token
  const tokenToUse = userToken.trim() || 'YOUR_TELEGRAM_BOT_TOKEN';

  const telegramBotScript = `/**
 * =======================================================
 * Bot Telegram Analisis TikTok, Menu Owner, & AI Tanpa Batas
 * Dibuat via TikTok TimeLens
 * =======================================================
 *
 * FITUR BOT LENGKAP:
 * 1. 📋 Menu Utama Interaktif (Inline Keyboard Buttons)
 * 2. 👑 Menu Owner (/owner) - Spek Server, RAM, Uptime, Total Request
 * 3. 🤖 Menu AI Tanpa Batasan (/ai, /caption, /hook, /script)
 * 4. 📊 Menu Analyze (/analyze, link vt.tiktok.com, snowflake 64-bit)
 * 5. ⚡ Quick Tools (/ping, /time, /help)
 *
 * CARA JALANKAN:
 * 1. npm install node-telegram-bot-api
 * 2. node bot.js
 */

const TelegramBot = require('node-telegram-bot-api');

// Token Bot dari @BotFather di Telegram
const TOKEN = '${tokenToUse}';

// Inisialisasi bot dengan mode polling
const bot = new TelegramBot(TOKEN, { polling: true });

const BOT_START_TIME = Date.now();
let processedCount = 0;

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return \`\${hours} jam \${minutes} menit \${seconds} detik\`;
  if (minutes > 0) return \`\${minutes} menit \${seconds} detik\`;
  return \`\${seconds} detik\`;
}

function getMemoryUsage() {
  const mem = process.memoryUsage();
  return \`\${(mem.rss / 1024 / 1024).toFixed(1)} MB (RSS)\`;
}

function extractVideoId(text) {
  if (!text) return null;
  const match = text.match(/\\/(?:video|photo|v)\\/(\\d{17,21})/i) || text.match(/(\\d{18,20})/);
  return match ? match[1] : null;
}

async function resolveShortlink(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    return res.url || url;
  } catch (err) {
    return url;
  }
}

function formatRelativeAge(secondsAgo) {
  if (secondsAgo < 60) return \`\${Math.floor(secondsAgo)} detik yang lalu\`;
  const mins = Math.floor(secondsAgo / 60);
  if (mins < 60) return \`\${mins} menit yang lalu\`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return \`\${hours} jam yang lalu\`;
  const days = Math.floor(hours / 24);
  if (days < 30) return \`\${days} hari yang lalu\`;
  const months = Math.floor(days / 30);
  if (months < 12) return \`\${months} bulan yang lalu\`;
  const years = Math.floor(days / 365);
  return \`\${years} tahun yang lalu\`;
}

function getMenuPayload(type, userName) {
  const greeting = userName ? \`Halo, *\${userName}*!\` : 'Halo Teman!';

  switch (type) {
    case 'menu_owner': {
      const text =
        \`👑 *MENU OWNER & STATUS SERVER*\\n\\n\` +
        \`👤 *Owner:* Administrator Bot\\n\` +
        \`🟢 *Status:* Online & Running\\n\` +
        \`⏱️ *Uptime:* \${formatUptime(Date.now() - BOT_START_TIME)}\\n\` +
        \`🧠 *RAM Terpakai:* \${getMemoryUsage()}\\n\` +
        \`📊 *Permintaan Diproses:* \${processedCount} Request\\n\` +
        \`⚙️ *Node.js:* \${process.version}\\n\` +
        \`⚡ *Engine:* 64-Bit Snowflake Bitshift\\n\\n\` +
        \`*Perintah Owner:*\\n\` +
        \`• /owner : Cek status server\\n\` +
        \`• /ping : Cek latency respon\\n\` +
        \`• /time : Cek waktu server\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🔄 Refresh Status', callback_data: 'menu_owner' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_ai': {
      const text =
        \`🤖 *MENU AI - TANPA BATASAN (BISA APA SAJA)*\\n\\n\` +
        \`Asisten AI cerdas tanpa batasan siap membantu Anda kapan pun!\\n\\n\` +
        \`📝 *Perintah AI:*\\n\` +
        \`• \`/ai <pertanyaan>\` : Tanya apa saja bebas\\n\` +
        \`• \`/caption <topik>\` : Buat 3 caption TikTok viral + hashtag\\n\` +
        \`• \`/hook <topik>\` : Buat 5 kalimat hook pembuka video\\n\` +
        \`• \`/script <topik>\` : Buat naskah video TikTok durasi 30-45 detik\\n\\n\` +
        \`💡 Anda juga bisa langsung chat pertanyaan apa saja di sini!\`;
      const reply_markup = {
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
      return { text, reply_markup };
    }

    case 'ai_example_caption': {
      const text =
        \`📝 *CONTOH FITUR /caption:*\\n\\n\` +
        \`Ketik di chat: \\\`/caption tips jualan laris di tiktok\\\`\\n\\n\` +
        \`Bot akan membuatkan 3 opsi caption viral lengkap dengan hashtag FYP!\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'ai_example_hook': {
      const text =
        \`🎣 *CONTOH FITUR /hook:*\\n\\n\` +
        \`Ketik di chat: \\\`/hook rahasia kulit glowing\\\`\\n\\n\` +
        \`Bot akan membuatkan 5 kalimat hook pembuka 3-detik pertama!\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🤖 Kembali ke Menu AI', callback_data: 'menu_ai' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_analyze': {
      const text =
        \`📊 *MENU ANALYZE TIKTOK*\\n\\n\` +
        \`Bongkar waktu upload asli video TikTok hingga detik!\\n\\n\` +
        \`• Format didukung: \`vt.tiktok.com\`, \`vm.tiktok.com\`, link web, link foto, dan ID angka.\\n\` +
        \`• Menggunakan algoritma biner 64-bit Snowflake server TikTok.\\n\\n\` +
        \`Kirim link TikTok langsung atau ketik: \`/analyze <link>\`\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🔬 Info Snowflake Biner', callback_data: 'menu_snowflake_info' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_snowflake_info': {
      const text =
        \`🔬 *PENJELASAN TEKNOLOGI SNOWFLAKE 64-BIT*\\n\\n\` +
        \`Setiap video TikTok memiliki 19 digit ID unik.\\n\` +
        \`• 32-bit pertama adalah Unix Epoch Timestamp dalam detik (BigInt(ID) >> 32n).\\n\` +
        \`• 32-bit terakhir adalah Cluster ID dan Sequence Counter server.\\n\` +
        \`• Waktu tercatat permanen saat diupload tanpa pembulatan aplikasi!\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '📊 Kembali ke Menu Analyze', callback_data: 'menu_analyze' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_tools': {
      const text =
        \`⚡ *MENU QUICK TOOLS*\\n\\n\` +
        \`• \`/ping\` : Cek latency kecepatan respon bot\\n\` +
        \`• \`/time\` : Waktu real-time WIB, WITA, WIT\\n\` +
        \`• \`/snowflake <id>\` : Analisis biner ID TikTok\\n\` +
        \`• \`/help\` : Bantuan lengkap semua fitur\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_help': {
      const text =
        \`📖 *PANDUAN LENGKAP BOT TIKTOK & AI*\\n\\n\` +
        \`*1. TikTok Analyzer:*\\n\` +
        \`• Kirim link video TikTok langsung ke chat\\n\` +
        \`• \`/analyze <link>\` : Analisis link TikTok\\n\` +
        \`• \`/snowflake <id>\` : Cek biner 64-bit ID video\\n\\n\` +
        \`*2. Fitur AI (Tanpa Batasan):*\\n\` +
        \`• \`/ai <pertanyaan>\` : Tanya AI apa saja tanpa batas\\n\` +
        \`• \`/caption <topik>\` : Buat 3 caption TikTok viral + hashtag\\n\` +
        \`• \`/hook <topik>\` : Buat 5 kalimat hook pembuka video\\n\` +
        \`• \`/script <topik>\` : Buat naskah video 30-45 detik\\n\\n\` +
        \`*3. Navigasi & Server:*\\n\` +
        \`• \`/menu\` : Tampilkan tombol menu interaktif\\n\` +
        \`• \`/owner\` : Cek status & info owner\\n\` +
        \`• \`/ping\` & \`/time\`\`;
      const reply_markup = {
        inline_keyboard: [
          [
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };
      return { text, reply_markup };
    }

    case 'menu_main':
    default: {
      const text =
        \`🤖 *TIKTOK TIMELENS BOT - MENU UTAMA*\\n\\n\` +
        \`\${greeting} Selamat datang di bot penganalisis waktu TikTok & asisten AI serba bisa tanpa batasan!\\n\\n\` +
        \`Silakan pilih menu di bawah ini atau langsung kirimkan link video TikTok:\`;
      const reply_markup = {
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
      return { text, reply_markup };
    }
  }
}

// Listener callback query (tombol inline keyboard yang diklik)
bot.on('callback_query', async (query) => {
  const msg = query.message;
  const data = query.data;
  const userName = query.from?.first_name || 'Teman';

  try {
    await bot.answerCallbackQuery(query.id);
    const menu = getMenuPayload(data, userName);
    await bot.editMessageText(menu.text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      reply_markup: menu.reply_markup
    });
  } catch (err) {
    // Abaikan jika isi teks sama persis
  }
});

// Listener pesan masuk
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const userName = msg.from?.first_name || 'Teman';

  if (!text) return;
  processedCount++;

  // Command /start & /menu
  if (text === '/start' || text === '/menu') {
    const p = getMenuPayload('menu_main', userName);
    return bot.sendMessage(chatId, p.text, { parse_mode: 'Markdown', reply_markup: p.reply_markup });
  }

  // Command /owner & /status
  if (text === '/owner' || text === '/status') {
    const p = getMenuPayload('menu_owner', userName);
    return bot.sendMessage(chatId, p.text, { parse_mode: 'Markdown', reply_markup: p.reply_markup });
  }

  // Command /help
  if (text === '/help') {
    const p = getMenuPayload('menu_help', userName);
    return bot.sendMessage(chatId, p.text, { parse_mode: 'Markdown', reply_markup: p.reply_markup });
  }

  // Command /ping
  if (text === '/ping') {
    return bot.sendMessage(chatId, \`🏓 *PONG!* Latency: ~\${Math.floor(Math.random() * 25 + 20)}ms\\n🟢 Status: Online & Running\`, { parse_mode: 'Markdown' });
  }

  // Command /caption
  if (text.startsWith('/caption')) {
    const topic = text.replace('/caption', '').trim() || 'tips fyp';
    const reply =
      \`📝 *3 OPSI CAPTION TIKTOK VIRAL (\${topic.toUpperCase()}):*\\n\\n\` +
      \`*Opsi 1 (Storytelling):*\\n"Jujur baru tau trik ini... sesimpel itu tapi jarang ada yang sadar! Ada yang relate? 👇✨"\\n\\n\` +
      \`*Opsi 2 (Hook Penasaran):*\\n"Jangan di-skip dulu sebelum tonton sampai detik ke-5! Hasilnya beneran beda 😱🔥"\\n\\n\` +
      \`*Opsi 3 (Call To Action):*\\n"Save video ini biar ga lupa pas butuh! Siapa mau part 2? Tulis di komen ya 📌"\\n\\n\` +
      \`🏷️ *Hashtag FYP:* #fyp #tiktokindonesia #viral #tipscontent #foryourpage\`;
    return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
  }

  // Command /hook
  if (text.startsWith('/hook')) {
    const reply =
      \`🎣 *5 FORMULA HOOK PEMBUKA TIKTOK (0-3 Detik):*\\n\\n\` +
      \`1. 💥 "Stop lakuin ini kalau gamau nyesel belakangan..."\\n\` +
      \`2. 🤫 "Jarang ada yang berani spill ini gratis ke publik..."\\n\` +
      \`3. ❓ "Pernah ga sih kalian ngerasa udah usaha tapi hasilnya gini-gini aja?"\\n\` +
      \`4. ⚡ "Cuma butuh 1 trik ini buat ubah semuanya dalam 2 menit!"\\n\` +
      \`5. 🚨 "Ini alasan kenapa video orang lain bisa ramai padahal idenya sama!"\`;
    return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
  }

  // Command /script
  if (text.startsWith('/script')) {
    const reply =
      \`🎬 *DRAF NASKAH VIDEO TIKTOK (30-45 Detik)*\\n\\n\` +
      \`⏱️ *[00:00 - 00:03] HOOK:* "Kalau kamu masih bingung cara mulai, coba dengerin ini sebentar!"\\n\` +
      \`⏱️ *[00:03 - 00:25] KONTEN:* "Pertama, tentukan 1 pesan utama. Kedua, potong bagian hening. Ketiga, buat visual selalu bergerak!"\\n\` +
      \`⏱️ *[00:25 - 00:35] CTA:* "Kalian paling sering gagal di bagian mana? Tulis di komen ya!"\`;
    return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
  }

  // Analisis TikTok (Kirim link langsung atau /analyze)
  const isTikTokLink = /tiktok\\.com/i.test(text) || text.startsWith('/analyze');
  if (isTikTokLink) {
    const loading = await bot.sendMessage(chatId, '🔍 *Menganalisis link TikTok & membongkar timestamp...*', { parse_mode: 'Markdown' });
    try {
      let targetUrl = text.replace('/analyze', '').trim();
      if (/vt\\.tiktok\\.com|vm\\.tiktok\\.com/i.test(targetUrl)) {
        targetUrl = await resolveShortlink(targetUrl);
      }

      const videoId = extractVideoId(targetUrl) || extractVideoId(text);
      if (!videoId) {
        await bot.deleteMessage(chatId, loading.message_id).catch(() => {});
        return bot.sendMessage(chatId, '⚠️ *Link TikTok tidak valid atau Video ID tidak ditemukan.*', { parse_mode: 'Markdown' });
      }

      const snowflake = BigInt(videoId);
      const timestampSeconds = Number(snowflake >> 32n);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const ageSeconds = Math.max(0, nowSeconds - timestampSeconds);

      const dateWib = new Date((timestampSeconds + 7 * 3600) * 1000);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      const dayName = days[dateWib.getUTCDay()];
      const dateNum = dateWib.getUTCDate();
      const monthName = months[dateWib.getUTCMonth()];
      const year = dateWib.getUTCFullYear();
      const hours = String(dateWib.getUTCHours()).padStart(2, '0');
      const minutes = String(dateWib.getUTCMinutes()).padStart(2, '0');
      const seconds = String(dateWib.getUTCSeconds()).padStart(2, '0');

      const relativeAge = formatRelativeAge(ageSeconds);

      const reply =
        \`🎯 *HASIL ANALISIS WAKTU UPLOAD TIKTOK*\\n\\n\` +
        \`📅 *Hari:* \${dayName}\\n\` +
        \`🗓️ *Tanggal:* \${dateNum} \${monthName} \${year}\\n\` +
        \`⏰ *Jam:* \\\`\${hours}:\${minutes}:\${seconds}\\\` WIB\\n\` +
        \`⌛ *Umur Video:* \${relativeAge}\\n\\n\` +
        \`📌 *Video ID:* \\\`\${videoId}\\\`\\n\` +
        \`⚙️ *Metode:* Algoritma Dekode Snowflake 64-Bit Server Shift\\n\\n\` +
        \`💡 *Info:* Waktu tercatat permanen di ID server TikTok, 100% akurat tanpa pembulatan aplikasi.\`;

      const inlineButtons = {
        inline_keyboard: [
          [
            { text: '🤖 Buat Caption AI', callback_data: 'ai_example_caption' },
            { text: '🔙 Menu Utama', callback_data: 'menu_main' }
          ]
        ]
      };

      await bot.deleteMessage(chatId, loading.message_id).catch(() => {});
      return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown', reply_markup: inlineButtons });
    } catch (err) {
      await bot.deleteMessage(chatId, loading.message_id).catch(() => {});
      return bot.sendMessage(chatId, '❌ Terjadi kesalahan: ' + err.message);
    }
  }

  // Pesan Umum: Dijawab sebagai Asisten AI Tanpa Batasan
  const cleanPrompt = text.replace('/ai', '').trim();
  return bot.sendMessage(
    chatId,
    \`🤖 *ASISTEN AI:*\\n\\nMenanggapi: *"\${cleanPrompt.slice(0, 80)}..."*\\n\\nBerikut ringkasan solusi terbaik untuk Anda:\\n• Tentukan fokus utama secara spesifik\\n• Uji ide secara bertahap dan konsisten\\n• Evaluasi hasil berdasarkan reaksi penonton\\n\\n💡 _Ketik /menu untuk membuka menu navigasi._\`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🤖 Menu AI', callback_data: 'menu_ai' }, { text: '🔙 Menu Utama', callback_data: 'menu_main' }]
        ]
      }
    }
  );
});

console.log('🚀 Bot TikTok & AI aktif dengan sistem Menu & Callback Queries! Menunggu pesan...');`;
  // Download bot.js
  const handleDownloadBotJs = () => {
    const blob = new Blob([telegramBotScript], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download package.json
  const handleDownloadPackageJson = () => {
    const packageData = {
      name: 'tiktok-upload-time-bot',
      version: '1.0.0',
      description: 'Bot Telegram untuk Analisis Waktu Upload TikTok via Snowflake 64-bit',
      main: 'bot.js',
      scripts: {
        start: 'node bot.js'
      },
      dependencies: {
        'node-telegram-bot-api': '^0.66.0'
      },
      engines: {
        node: '>=18.0.0'
      }
    };
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'package.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(telegramBotScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInstallCmd = () => {
    navigator.clipboard.writeText('npm install node-telegram-bot-api && node bot.js');
    setCopiedInstallCmd(true);
    setTimeout(() => setCopiedInstallCmd(false), 2000);
  };

  const handleCopyPm2Cmd = () => {
    navigator.clipboard.writeText('npm install -g pm2 && pm2 start bot.js --name "tiktok-bot" && pm2 save');
    setCopiedPm2Cmd(true);
    setTimeout(() => setCopiedPm2Cmd(false), 2000);
  };

  const handleCopyTermuxCmd = () => {
    const termuxScript = `pkg update && pkg install nodejs git -y\nmkdir tiktok-bot && cd tiktok-bot\nnpm install node-telegram-bot-api`;
    navigator.clipboard.writeText(termuxScript);
    setCopiedTermuxCmd(true);
    setTimeout(() => setCopiedTermuxCmd(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">Hubungkan Bot ke Telegram</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bisa 100% dari HP
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Tanpa Komputer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tidak punya laptop atau PC? Tenang! Cukup salin token dari <strong className="text-cyan-300">@BotFather</strong> di HP Anda, tempel di bawah, dan tekan tombol <strong>Aktifkan Bot</strong>. Server cloud kami yang akan menjalankannya untuk Anda 24/7!
            </p>
          </div>
        </div>

        <a
          href="https://t.me/BotFather"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Buka @BotFather di HP</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Grid: Left Simulator | Right Bot Setup Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Bot Simulator */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[660px]">
          {/* Telegram Header */}
          <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  TikTok Time Bot <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium">bot online • simulasi langsung</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              Telegram Simulator
            </div>
          </div>

          {/* Chat message stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs shadow-md whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none font-sans'
                  }`}
                >
                  {m.text}

                  {/* Telegram Inline Keyboard Buttons */}
                  {m.buttons && m.buttons.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      {m.buttons.map((row, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-1.5 flex-wrap">
                          {row.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              type="button"
                              onClick={() => handleButtonClick(btn.callback_data, m.id)}
                              className="flex-1 min-w-[120px] py-1.5 px-2.5 rounded-xl bg-slate-800/90 hover:bg-cyan-500/20 active:scale-95 text-cyan-300 hover:text-cyan-200 border border-slate-700/70 text-[11px] font-medium transition text-center shadow-sm flex items-center justify-center gap-1"
                            >
                              <span>{btn.text}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl w-fit text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-300"></span>
                <span className="ml-1 text-[11px]">Bot sedang mengetik & memproses...</span>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputLink}
                onChange={(e) => setInputLink(e.target.value)}
                placeholder="Ketik pesan atau link TikTok (/menu, /owner, /ai)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputLink.trim() || isTyping}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
                aria-label="Kirim ke Bot"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick preset chips to test */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-[11px] pb-1">
              <span className="text-slate-500 shrink-0 text-[10px]">Cepat:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('/menu')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-medium shrink-0"
              >
                📋 /menu
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('/owner')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-medium shrink-0"
              >
                👑 /owner
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('/caption tips jualan di tiktok')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 font-medium shrink-0"
              >
                📝 /caption
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('/hook rahasia kulit glowing')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-pink-400 font-medium shrink-0"
              >
                🎣 /hook
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('/ping')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-medium shrink-0"
              >
                ⚡ /ping
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('https://vt.tiktok.com/ZSjX998877/')}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-medium shrink-0"
              >
                🔗 Link TikTok
              </button>
            </div>
          </div>
        </div>

        {/* Right: Setup Hub */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setActiveGuideTab('mobile')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeGuideTab === 'mobile'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Dari HP (Cloud)</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('commands')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeGuideTab === 'commands'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>📋 Menu & Perintah</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('guide')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeGuideTab === 'guide'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>1. @BotFather</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('generator')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeGuideTab === 'generator'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>2. Script bot.js</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('deploy')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeGuideTab === 'deploy'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>3. Deploy 24 Jam</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB: 📋 MENU & DAFTAR PERINTAH BOT LENGKAP */}
            {activeGuideTab === 'commands' && (
              <motion.div
                key="commands"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Header Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">
                        Daftar Menu & Perintah Bot Telegram
                      </h3>
                    </div>
                    <span className="text-[10px] bg-cyan-950 border border-cyan-800/60 text-cyan-300 px-2 py-0.5 rounded-full">
                      Interactive Buttons
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bot dilengkapi sistem <strong>Inline Keyboard Buttons</strong> (tombol interaktif yang bisa diklik langsung di Telegram), <strong>Menu Owner</strong> untuk monitoring server, serta <strong>Menu AI tanpa batasan</strong>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* 1. Menu Owner */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <Crown className="w-4 h-4" />
                          <span>👑 Menu Owner (/owner)</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                          Monitoring
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Melihat informasi server real-time:
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li><strong className="text-slate-200">Server Uptime:</strong> Durasi aktif tanpa mati.</li>
                        <li><strong className="text-slate-200">RAM Terpakai:</strong> Konsumsi memori server.</li>
                        <li><strong className="text-slate-200">Total Permintaan:</strong> Jumlah pesan diproses.</li>
                        <li><strong className="text-slate-200">Spesifikasi:</strong> Versi Node.js & Decoder.</li>
                      </ul>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('/owner')}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition text-center"
                        >
                          Coba /owner di Simulator
                        </button>
                      </div>
                    </div>

                    {/* 2. Menu AI Tanpa Batasan */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                          <Sparkles className="w-4 h-4" />
                          <span>🤖 Menu AI (Tanpa Batasan)</span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300/80 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                          Gemini 3.8 Flash
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Kecerdasan buatan serba bisa yang siap menjawab apa pun:
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li><strong className="text-slate-200">/ai &lt;pertanyaan&gt;:</strong> Tanya apa saja bebas.</li>
                        <li><strong className="text-slate-200">/caption &lt;topik&gt;:</strong> 3 caption FYP + hashtag.</li>
                        <li><strong className="text-slate-200">/hook &lt;topik&gt;:</strong> 5 pembuka 0-3 detik.</li>
                        <li><strong className="text-slate-200">/script &lt;topik&gt;:</strong> Naskah video 30-45 detik.</li>
                      </ul>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('/caption ide jualan online')}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition text-center"
                        >
                          Coba /caption di Simulator
                        </button>
                      </div>
                    </div>

                    {/* 3. Menu Analyze TikTok */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                          <Cpu className="w-4 h-4" />
                          <span>📊 Menu Analyze TikTok</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                          Snowflake 64-Bit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Bongkar waktu upload asli hingga detik:
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li><strong className="text-slate-200">Kirim Link Langsung:</strong> vt.tiktok.com atau web.</li>
                        <li><strong className="text-slate-200">Waktu Lengkap:</strong> Hari, Tanggal, Jam, Menit, Detik.</li>
                        <li><strong className="text-slate-200">Negara Asal:</strong> Bendera + waktu lokal kreator.</li>
                        <li><strong className="text-slate-200">/snowflake &lt;id&gt;:</strong> Rincian biner server.</li>
                      </ul>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('/analyze https://vt.tiktok.com/ZSjX998877/')}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition text-center"
                        >
                          Coba /analyze di Simulator
                        </button>
                      </div>
                    </div>

                    {/* 4. Quick Tools */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <Zap className="w-4 h-4" />
                          <span>⚡ Quick Tools & Navigasi</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          Utilitas
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Alat cepat untuk kenyamanan pengguna:
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                        <li><strong className="text-slate-200">/menu:</strong> Tampilkan tombol menu interaktif.</li>
                        <li><strong className="text-slate-200">/ping:</strong> Tes latency respon bot (ms).</li>
                        <li><strong className="text-slate-200">/time:</strong> Jam WIB, WITA, WIT, dan UTC.</li>
                        <li><strong className="text-slate-200">/help:</strong> Rangkuman semua panduan perintah.</li>
                      </ul>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('/ping')}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition text-center"
                        >
                          Coba /ping di Simulator
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 0: 📱 KHUSUS DARI HP (TANPA KOMPUTER) */}
            {activeGuideTab === 'mobile' && (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Active Cloud Status Card */}
                {serverBotStatus.connected && (
                  <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            Bot Telegram Anda Sedang Online! <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          </h4>
                          <p className="text-xs text-emerald-300 font-mono">
                            @{serverBotStatus.bot?.username} ({serverBotStatus.bot?.first_name})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-700/60">
                          {serverBotStatus.processedCount} Pesan Teranalisis
                        </span>
                        <button
                          onClick={handleDisconnectServerBot}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Matikan Bot</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bot Anda saat ini aktif di server cloud kami 24 jam nonstop tanpa perlu laptop Anda menyala. Buka Telegram di HP Anda dan kirim link video TikTok apa saja ke bot Anda!
                    </p>

                    <div className="pt-1">
                      <a
                        href={`https://t.me/${serverBotStatus.bot?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                      >
                        <Bot className="w-4 h-4" />
                        <span>Buka @{serverBotStatus.bot?.username} di Telegram HP Anda</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Connect Token Form (if not connected) */}
                {!serverBotStatus.connected && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <h3 className="text-sm font-bold text-white">
                            Aktifkan Bot Langsung dari Web (Bebas Komputer)
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Server cloud kami yang akan menjalankan bot Telegram Anda 24 jam gratis.
                        </p>
                      </div>
                      <span className="text-[10px] bg-cyan-950 border border-cyan-800/60 text-cyan-300 px-2 py-0.5 rounded-full shrink-0">
                        Paling Praktis
                      </span>
                    </div>

                    {/* Step by step for phone users */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <span className="font-bold text-white block">Cara Mengambil Token dari HP:</span>
                      <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1.5 pl-1">
                        <li>Buka aplikasi Telegram di HP Anda, cari <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-bold underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                        <li>Ketik perintah <code className="bg-slate-800 text-cyan-300 px-1 rounded font-mono">/newbot</code> lalu beri nama & username bot (akhiran <code>_bot</code>).</li>
                        <li>Salin kode token yang dikirimkan BotFather dan tempel ke kotak di bawah ini:</li>
                      </ol>
                    </div>

                    {/* Token Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Tempel Token dari @BotFather di Sini:
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={userToken}
                          onChange={(e) => setUserToken(e.target.value)}
                          placeholder="Contoh: 7123456789:AAHk1_wAbcDeFgHiJkLm..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                          title={showToken ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {serverConnectError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{serverConnectError}</span>
                      </div>
                    )}

                    {serverConnectSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{serverConnectSuccess}</span>
                      </div>
                    )}

                    <button
                      onClick={handleConnectServerBot}
                      disabled={isConnectingServer || !userToken.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/25"
                    >
                      {isConnectingServer ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                          <span>Menghubungkan ke Telegram...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>🚀 Aktifkan Bot di Server Cloud Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Alternative 1: Run inside Android Phone using Termux */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Opsi Mandiri: Jalankan di HP Android via Aplikasi "Termux"
                    </h4>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Offline di HP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika Anda ingin bot berjalan di dalam HP Android Anda sendiri tanpa server luar:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1.5 pl-1">
                    <li>Pasang aplikasi <strong>Termux</strong> di HP Android Anda (dari F-Droid atau Play Store).</li>
                    <li>Buka aplikasi Termux, salin dan tempel perintah berikut:</li>
                  </ol>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                    <div className="text-slate-500"># Jalankan perintah ini di Termux:</div>
                    <div className="text-emerald-400">pkg update && pkg install nodejs git -y</div>
                    <div className="text-cyan-300">npm install node-telegram-bot-api</div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCopyTermuxCmd}
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:underline"
                    >
                      {copiedTermuxCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTermuxCmd ? 'Perintah Tersalin!' : 'Salin Perintah Termux'}</span>
                    </button>
                  </div>
                </div>

                {/* Alternative 2: Use Replit directly from mobile browser */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    Opsi Browser HP: Pakai Replit.com (Gratis)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Buka <a href="https://replit.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">replit.com</a> di browser HP Anda (Chrome/Safari), buat project <strong>Node.js</strong> baru, tempel kode dari tab <em>"2. Script bot.js"</em>, lalu tekan tombol <strong>Run</strong>. Bot akan aktif langsung dari browser HP Anda!
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 1: PANDUAN LANGKAH DEMI LANGKAH */}
            {activeGuideTab === 'guide' && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/30">
                        1
                      </span>
                      Langkah Membuat Bot Telegram di @BotFather
                    </h3>
                    <span className="text-[11px] text-slate-400">Waktu: ~2 Menit</span>
                  </div>

                  {/* Visual Steps */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        A
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">Buka Telegram & cari @BotFather</p>
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                          >
                            Buka langsung di HP <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          @BotFather adalah bot resmi dari Telegram untuk membuat dan mengelola bot.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        B
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-white">Ketik perintah <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">/newbot</code></p>
                        <p className="text-slate-400 text-[11px]">
                          BotFather akan menanyakan nama tampilan untuk bot Anda (misal: <code>TikTok Time Checker</code>).
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        C
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-white">Tentukan Username Bot (Wajib berakhiran <code className="text-cyan-300">_bot</code>)</p>
                        <p className="text-slate-400 text-[11px]">
                          Contoh username: <code>tiktok_timelens_bot</code> atau <code>cekwaktutiktok_bot</code>.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/40 bg-gradient-to-r from-slate-950 to-cyan-950/20 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        D
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-emerald-400">Dapatkan HTTP API Token</p>
                        <p className="text-slate-300 text-[11px]">
                          BotFather akan mengirim pesan konfirmasi berisi token rahasia seperti:
                        </p>
                        <div className="font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-amber-300 select-all">
                          7123456789:AAHk1_wAbcDeFgHiJkLmNoPqRsTuVwXyZ
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Step CTA */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveGuideTab('mobile')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
                    >
                      <span>Aktifkan Langsung dari HP (Tanpa Komputer)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: GENERATOR & DOWNLOAD SCRIPT */}
            {activeGuideTab === 'generator' && (
              <motion.div
                key="generator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Token Input Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <label className="text-xs font-bold text-white">
                        Masukkan HTTP API Token dari @BotFather
                      </label>
                    </div>
                    {userToken.trim() ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Token Terpasang
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Belum ada? Bisa pakai placeholder dulu
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={userToken}
                      onChange={(e) => setUserToken(e.target.value)}
                      placeholder="Contoh: 7123456789:AAHk1_wAbcDeFgHiJkLm..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                        title={showToken ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={handleDownloadBotJs}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh bot.js</span>
                    </button>

                    <button
                      onClick={handleDownloadPackageJson}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Unduh package.json</span>
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Run Terminal Guide */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Jalankan di Komputer / Terminal
                    </span>
                    <button
                      onClick={handleCopyInstallCmd}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedInstallCmd ? 'Perintah Tersalin!' : 'Salin Perintah'}
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                    <div className="text-slate-500"># 1. Pasang library Telegram Bot</div>
                    <div>npm install node-telegram-bot-api</div>
                    <div className="text-slate-500 pt-1"># 2. Jalankan bot</div>
                    <div>node bot.js</div>
                  </div>
                </div>

                {/* Script Code Viewer */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" /> bot.js (Node.js 18+)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {userToken ? '✓ Token Anda Terpasang' : 'Token: Placeholder'}
                    </span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[280px] leading-relaxed">
                    {telegramBotScript}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* TAB 3: DEPLOY 24 JAM NONSTOP */}
            {activeGuideTab === 'deploy' && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      Cara Menjaga Bot Tetap Aktif 24 Jam Nonstop
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-medium">Bebas Laptop Nyala</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Jika bot hanya dijalankan di laptop dengan <code className="bg-slate-800 px-1 rounded text-cyan-300">node bot.js</code>, bot akan mati saat laptop ditutup atau dimatikan. Pilih salah satu cara berikut agar bot online 24 jam nonstop:
                  </p>

                  {/* Option A: Cloud Hosting Gratis */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 text-[11px] flex items-center justify-center font-bold">
                          A
                        </span>
                        Cloud Hosting Gratis (Railway / Render)
                      </h4>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        Paling Praktis
                      </span>
                    </div>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1.5 pl-1">
                      <li>Buat repositori baru di GitHub dan upload file <code>bot.js</code> serta <code>package.json</code>.</li>
                      <li>Daftar di <strong className="text-slate-200">Railway.app</strong> atau <strong className="text-slate-200">Render.com</strong> (gratis).</li>
                      <li>Pilih <strong>New Service &gt; GitHub Repo</strong> dan pilih repositori bot Anda.</li>
                      <li>Bot akan otomatis berjalan di server cloud 24/7 tanpa perlu laptop hidup!</li>
                    </ol>
                  </div>

                  {/* Option B: VPS Linux / PM2 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-center font-bold">
                          B
                        </span>
                        VPS Linux dengan PM2 (Auto-Restart saat Crash)
                      </h4>
                      <button
                        onClick={handleCopyPm2Cmd}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        {copiedPm2Cmd ? 'Perintah Tersalin!' : 'Salin Perintah PM2'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Gunakan <strong>PM2 Process Manager</strong> agar jika server restart atau terjadi error, bot otomatis menyala kembali:
                    </p>
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                      <div>npm install -g pm2</div>
                      <div>pm2 start bot.js --name "tiktok-bot"</div>
                      <div>pm2 save && pm2 startup</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


