/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FormattedDateTimeResult {
  timestampSeconds: number;
  timestampMs: number;
  dayName: string;
  dayNumber: number;
  monthName: string;
  monthNumber: number;
  year: number;
  hours: string;
  minutes: string;
  seconds: string;
  formattedDate: string;
  formattedDateWithDay: string;
  formattedTime: string;
  formattedFull: string;
  timezoneLabel: string;
  isoString: string;
}

export interface TimeOfDayInfo {
  category: 'Dini Hari' | 'Pagi' | 'Siang' | 'Sore' | 'Malam';
  periodName: string;
  icon: string;
  description: string;
}

export interface PrimeTimeAnalysis {
  rating: 'SUPER PRIME' | 'PRIME' | 'NORMAL' | 'OFF-PEAK';
  color: string;
  badge: string;
  advice: string;
}

export interface SnowflakeInfo {
  videoId: string;
  binaryFull: string;
  binaryTimestamp: string;
  binaryWorker: string;
  decimalTimestamp: number;
  epochDateUtc: string;
}

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Extracts a numeric TikTok Video ID from a string or URL.
 */
export function extractVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If pure numeric string (17-21 digits)
  if (/^\d{17,21}$/.test(trimmed)) {
    return trimmed;
  }

  // Check pattern: /video/(\d+)
  const videoMatch = trimmed.match(/\/video\/(\d{17,21})/i);
  if (videoMatch && videoMatch[1]) {
    return videoMatch[1];
  }

  // Check pattern: /photo/(\d+)
  const photoMatch = trimmed.match(/\/photo\/(\d{17,21})/i);
  if (photoMatch && photoMatch[1]) {
    return photoMatch[1];
  }

  // Check pattern: /v/(\d+)
  const vMatch = trimmed.match(/\/v\/(\d{17,21})/i);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // Check pattern: /player/v1/(\d+) or /embed/v2/(\d+)
  const embedMatch = trimmed.match(/\/(?:player\/v1|embed\/v2)\/(\d{17,21})/i);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  // Check parameter itemId or item_id=(\d+)
  const paramMatch = trimmed.match(/[?&](?:item_id|itemId|id)=(\d{17,21})/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1];
  }

  // Generic 18-20 digit match if tiktok is in the string
  if (trimmed.includes('tiktok')) {
    const genericMatch = trimmed.match(/(\d{18,20})/);
    if (genericMatch && genericMatch[1]) {
      return genericMatch[1];
    }
  }

  return null;
}

/**
 * Check if the URL is a short TikTok link requiring redirect expansion
 */
export function isShortUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return (
    /vt\.tiktok\.com\/[a-zA-Z0-9_\-]+/i.test(trimmed) ||
    /vm\.tiktok\.com\/[a-zA-Z0-9_\-]+/i.test(trimmed) ||
    /tiktok\.com\/t\/[a-zA-Z0-9_\-]+/i.test(trimmed)
  );
}

/**
 * Extract author username handle (@username) if available in URL
 */
export function extractAuthorHandle(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/@([a-zA-Z0-9_.-]{2,30})/);
  return match ? `@${match[1]}` : null;
}

/**
 * Decodes TikTok Snowflake ID to Unix timestamp.
 * TikTok uses a 64-bit ID where the upper 32 bits represent Unix timestamp in seconds.
 */
export function getTimestampFromVideoId(videoId: string): { timestampSeconds: number; timestampMs: number; dateUtc: Date } | null {
  try {
    if (!videoId || !/^\d{17,21}$/.test(videoId)) return null;

    const bigId = BigInt(videoId);
    // Shift right by 32 bits
    const timestampSeconds = Number(bigId >> 32n);

    // Sanity check: TikTok launched around Sept 2016 (1472688000).
    // Timestamp should be >= 1472688000 and <= year 2040 (2208988800).
    if (timestampSeconds < 1472688000 || timestampSeconds > 2208988800) {
      return null;
    }

    const timestampMs = timestampSeconds * 1000;
    const dateUtc = new Date(timestampMs);

    return {
      timestampSeconds,
      timestampMs,
      dateUtc
    };
  } catch {
    return null;
  }
}

/**
 * Formats date and time according to timezone offset in hours (e.g. +7 for WIB, +8 for WITA, +9 for WIT, 0 for UTC)
 */
export function formatUploadDateTime(
  timestampSeconds: number,
  timezoneOffsetHours: number,
  locale: 'id' | 'en' = 'id',
  timezoneName = 'WIB'
): FormattedDateTimeResult {
  const utcMs = timestampSeconds * 1000;
  // Apply offset in milliseconds
  const localMs = utcMs + timezoneOffsetHours * 3600 * 1000;
  const date = new Date(localMs);

  const dayOfWeek = date.getUTCDay(); // 0 is Sunday
  const dayNumber = date.getUTCDate();
  const monthNumber = date.getUTCMonth(); // 0-11
  const year = date.getUTCFullYear();

  const hoursNum = date.getUTCHours();
  const minutesNum = date.getUTCMinutes();
  const secondsNum = date.getUTCSeconds();

  const hours = String(hoursNum).padStart(2, '0');
  const minutes = String(minutesNum).padStart(2, '0');
  const seconds = String(secondsNum).padStart(2, '0');

  const daysList = locale === 'id' ? INDONESIAN_DAYS : ENGLISH_DAYS;
  const monthsList = locale === 'id' ? INDONESIAN_MONTHS : ENGLISH_MONTHS;

  const dayName = daysList[dayOfWeek];
  const monthName = monthsList[monthNumber];

  const formattedDate = locale === 'id'
    ? `${dayNumber} ${monthName} ${year}`
    : `${monthName} ${dayNumber}, ${year}`;

  const formattedDateWithDay = locale === 'id'
    ? `${dayName}, ${dayNumber} ${monthName} ${year}`
    : `${dayName}, ${monthName} ${dayNumber}, ${year}`;

  const formattedTime = `${hours}:${minutes}:${seconds}`;
  const formattedFull = `${formattedDateWithDay} • ${formattedTime} ${timezoneName}`;

  return {
    timestampSeconds,
    timestampMs: utcMs,
    dayName,
    dayNumber,
    monthName,
    monthNumber: monthNumber + 1,
    year,
    hours,
    minutes,
    seconds,
    formattedDate,
    formattedDateWithDay,
    formattedTime,
    formattedFull,
    timezoneLabel: `${timezoneName} (UTC${timezoneOffsetHours >= 0 ? '+' : ''}${timezoneOffsetHours})`,
    isoString: new Date(utcMs).toISOString()
  };
}

/**
 * Categorize time of day (Waktu Pagi, Siang, Sore, Malam, Dini Hari)
 */
export function getTimeOfDayCategory(hour: number): TimeOfDayInfo {
  if (hour >= 0 && hour < 5) {
    return {
      category: 'Dini Hari',
      periodName: 'Dini Hari / Larut Malam',
      icon: 'Moon',
      description: 'Diunggah saat sebagian besar audiens sedang beristirahat. Trafik umum relatif tenang.'
    };
  }
  if (hour >= 5 && hour < 11) {
    return {
      category: 'Pagi',
      periodName: 'Pagi Hari',
      icon: 'Sunrise',
      description: 'Diunggah pagi hari saat jam mulai beraktivitas, perjalanan kerja, dan cek media sosial pagi.'
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      category: 'Siang',
      periodName: 'Siang Hari (Break)',
      icon: 'Sun',
      description: 'Diunggah di sela jam istirahat makan siang. Banyak audiens aktif scroll TikTok.'
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      category: 'Sore',
      periodName: 'Sore Hari',
      icon: 'Sunset',
      description: 'Diunggah waktu pulang kantor/sekolah. Audiens mulai santai dan mencari hiburan ringan.'
    };
  }
  return {
    category: 'Malam',
    periodName: 'Malam Hari (Prime Time)',
    icon: 'Sparkles',
    description: 'Waktu santai santai paling ramai di TikTok di mana engagement dan views biasanya memuncak.'
  };
}

/**
 * Evaluates whether the upload was in a peak golden hour for TikTok Indonesia
 */
export function evaluatePrimeTime(hour: number, dayOfWeek: number): PrimeTimeAnalysis {
  // Prime times in Indonesia:
  // Siang: 12.00 - 13.00
  // Sore: 16.00 - 17.00
  // Malam: 19.00 - 21.30 (peak)
  // Weekend (Sabtu=6, Minggu=0): Pagi 09.00-11.00 juga sangat aktif
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if ((hour >= 19 && hour <= 21) || (isWeekend && hour >= 10 && hour <= 12)) {
    return {
      rating: 'SUPER PRIME',
      color: 'emerald',
      badge: '🔥 Golden Prime Time',
      advice: 'Video diunggah pada jam emas dengan trafik TikTok tertinggi. Sangat optimal untuk menjangkau FYP maksimal!'
    };
  }

  if ((hour >= 12 && hour <= 13) || (hour >= 16 && hour <= 18) || (hour === 22)) {
    return {
      rating: 'PRIME',
      color: 'blue',
      badge: '⚡ Prime Hour',
      advice: 'Video diunggah pada slot waktu sibuk (istirahat siang / sore santai). Potensi keterlibatan audiens sangat baik.'
    };
  }

  if ((hour >= 6 && hour <= 11) || (hour >= 14 && hour < 16) || (hour === 23)) {
    return {
      rating: 'NORMAL',
      color: 'amber',
      badge: '⏳ Regular Time',
      advice: 'Waktu unggah standar. Video bergantung kuat pada retensi audiens awal untuk didorong algoritma.'
    };
  }

  return {
    rating: 'OFF-PEAK',
    color: 'slate',
    badge: '🌙 Off-Peak Hour',
    advice: 'Diunggah pada waktu sepi/dini hari. Tingkat persaingan video baru lebih rendah, namun audiens aktif lebih sedikit.'
  };
}

/**
 * Calculates human-readable elapsed relative time (umur video)
 */
export function formatRelativeTime(
  timestampSeconds: number,
  currentTimestampSeconds: number = Math.floor(Date.now() / 1000),
  locale: 'id' | 'en' = 'id'
): string {
  const diff = Math.max(0, currentTimestampSeconds - timestampSeconds);

  const seconds = diff % 60;
  const totalMinutes = Math.floor(diff / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);

  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  if (locale === 'id') {
    if (diff < 60) return `${diff} detik yang lalu`;
    if (totalMinutes < 60) return `${totalMinutes} menit ${seconds} detik yang lalu`;
    if (totalHours < 24) return `${totalHours} jam ${minutes} menit yang lalu`;
    if (totalDays < 30) return `${totalDays} hari ${hours} jam yang lalu`;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} tahun`);
    if (months > 0) parts.push(`${months} bulan`);
    if (days > 0) parts.push(`${days} hari`);
    parts.push(`${hours} jam`);
    return `${parts.join(' ')} yang lalu`;
  } else {
    if (diff < 60) return `${diff}s ago`;
    if (totalMinutes < 60) return `${totalMinutes}m ${seconds}s ago`;
    if (totalHours < 24) return `${totalHours}h ${minutes}m ago`;
    if (totalDays < 30) return `${totalDays}d ${hours}h ago`;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo`);
    if (days > 0) parts.push(`${days} d`);
    return `${parts.join(' ')} ago`;
  }
}

/**
 * Technical inspection: converts the 64-bit snowflake ID into its binary breakdown
 */
export function getSnowflakeBitwiseInfo(videoId: string): SnowflakeInfo | null {
  try {
    if (!videoId || !/^\d{17,21}$/.test(videoId)) return null;
    const bigId = BigInt(videoId);
    let bin = bigId.toString(2);
    // Pad to 64 bits
    bin = bin.padStart(64, '0');

    const binaryTimestamp = bin.slice(0, 32);
    const binaryWorker = bin.slice(32);
    const decimalTimestamp = Number(bigId >> 32n);
    const epochDateUtc = new Date(decimalTimestamp * 1000).toUTCString();

    return {
      videoId,
      binaryFull: bin,
      binaryTimestamp,
      binaryWorker,
      decimalTimestamp,
      epochDateUtc
    };
  } catch {
    return null;
  }
}
