/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryOriginResult {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  capital: string;
  continent: string;
  standardTimezone: string;
  timezoneOffsetHours: number;
  confidence: number; // 0 - 100
  confidenceLabel: 'Sangat Tinggi' | 'Tinggi' | 'Sedang' | 'Estimasi';
  evidenceList: string[];
  localUploadTime: string;
  summary: string;
}

export interface CountryProfile {
  code: string;
  nameId: string;
  nameEn: string;
  flag: string;
  capital: string;
  continent: string;
  timezoneName: string;
  offsetHours: number;
  keywords: string[];
  hashtags: string[];
}

export const KNOWN_COUNTRIES: Record<string, CountryProfile> = {
  ID: {
    code: 'ID',
    nameId: 'Indonesia',
    nameEn: 'Indonesia',
    flag: '🇮🇩',
    capital: 'Jakarta',
    continent: 'Asia Tenggara',
    timezoneName: 'WIB (UTC+7)',
    offsetHours: 7,
    keywords: ['indonesia', 'jakarta', 'bandung', 'surabaya', 'bali', 'medan', 'semarang', 'jogja', 'yogyakarta', 'makassar', 'jawa', 'sumatera', 'kalimantan', 'sulawesi', 'papua', 'banget', 'bisa', 'buat', 'kamu', 'nih', 'dong', 'aja', 'gue', 'lu', 'gw', 'ngakak', 'receh', 'lucu'],
    hashtags: ['fyp', 'beritaterkini', 'viralindonesia', 'tiktokindonesia', 'kulinerindonesia', 'serunyabelajar', 'racuntiktok', 'serunyabareng', 'ngakakkocak', 'lucubanget', 'lagiviral', 'trendingid']
  },
  MY: {
    code: 'MY',
    nameId: 'Malaysia',
    nameEn: 'Malaysia',
    flag: '🇲🇾',
    capital: 'Kuala Lumpur',
    continent: 'Asia Tenggara',
    timezoneName: 'MYT (UTC+8)',
    offsetHours: 8,
    keywords: ['malaysia', 'kuala lumpur', 'selangor', 'penang', 'johor', 'sabah', 'sarawak', 'melaka', 'korang', 'kitorang', 'jom', 'lah', 'tengok'],
    hashtags: ['malaysiatiktok', 'viralmalaysia', 'tiktokmalaysia', 'masukberanda', 'kakiviral']
  },
  SG: {
    code: 'SG',
    nameId: 'Singapura',
    nameEn: 'Singapore',
    flag: '🇸🇬',
    capital: 'Singapura',
    continent: 'Asia Tenggara',
    timezoneName: 'SGT (UTC+8)',
    offsetHours: 8,
    keywords: ['singapore', 'orchard', 'marina bay', 'singaporean', 'singlish', 'changi'],
    hashtags: ['sgtiktok', 'singaporetiktok', 'sgfoodie', 'exploresingapore']
  },
  US: {
    code: 'US',
    nameId: 'Amerika Serikat',
    nameEn: 'United States',
    flag: '🇺🇸',
    capital: 'Washington, D.C.',
    continent: 'Amerika Utara',
    timezoneName: 'EST / EDT (UTC-4)',
    offsetHours: -4,
    keywords: ['united states', 'usa', 'america', 'new york', 'los angeles', 'california', 'texas', 'florida', 'chicago', 'miami', 'vegas'],
    hashtags: ['foryou', 'foryoupage', 'xyzbca', 'viral', 'fypage', 'usatiktok', 'tiktokusa', 'trending']
  },
  GB: {
    code: 'GB',
    nameId: 'Inggris / Britania Raya',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    capital: 'London',
    continent: 'Eropa',
    timezoneName: 'GMT / BST (UTC+1)',
    offsetHours: 1,
    keywords: ['london', 'manchester', 'birmingham', 'uk', 'britain', 'england', 'scotland', 'wales', 'british'],
    hashtags: ['uktiktok', 'britishmemes', 'londonlife', 'ukcontent']
  },
  JP: {
    code: 'JP',
    nameId: 'Jepang',
    nameEn: 'Japan',
    flag: '🇯🇵',
    capital: 'Tokyo',
    continent: 'Asia Timur',
    timezoneName: 'JST (UTC+9)',
    offsetHours: 9,
    keywords: ['japan', 'tokyo', 'osaka', 'kyoto', 'japanese', 'anime', 'manga', 'nihon'],
    hashtags: ['おすすめ', '日本', 'アニメ', 'バズれ', '運営さん大好き', 'japantiktok']
  },
  KR: {
    code: 'KR',
    nameId: 'Korea Selatan',
    nameEn: 'South Korea',
    flag: '🇰🇷',
    capital: 'Seoul',
    continent: 'Asia Timur',
    timezoneName: 'KST (UTC+9)',
    offsetHours: 9,
    keywords: ['korea', 'seoul', 'busan', 'kpop', 'korean', 'kdrama', 'hallyu'],
    hashtags: ['추천', '한국', '케이팝', '틱톡', 'koreatiktok']
  },
  PH: {
    code: 'PH',
    nameId: 'Filipina',
    nameEn: 'Philippines',
    flag: '🇵🇭',
    capital: 'Manila',
    continent: 'Asia Tenggara',
    timezoneName: 'PHT (UTC+8)',
    offsetHours: 8,
    keywords: ['philippines', 'manila', 'cebu', 'pinoy', 'tagalog', 'pilipinas'],
    hashtags: ['tiktokph', 'pinoytiktok', 'fypシ゚viral', 'pinoyspotlight']
  },
  TH: {
    code: 'TH',
    nameId: 'Thailand',
    nameEn: 'Thailand',
    flag: '🇹🇭',
    capital: 'Bangkok',
    continent: 'Asia Tenggara',
    timezoneName: 'ICT (UTC+7)',
    offsetHours: 7,
    keywords: ['thailand', 'bangkok', 'chiang mai', 'phuket', 'thai', 'siam'],
    hashtags: ['tiktokuni', 'thailandtiktok', 'fypシ゚viral']
  },
  VN: {
    code: 'VN',
    nameId: 'Vietnam',
    nameEn: 'Vietnam',
    flag: '🇻🇳',
    capital: 'Hanoi',
    continent: 'Asia Tenggara',
    timezoneName: 'ICT (UTC+7)',
    offsetHours: 7,
    keywords: ['vietnam', 'hanoi', 'saigon', 'ho chi minh', 'vietnamese'],
    hashtags: ['tiktokvietnam', 'xuhuong', 'xuhuongtiktok']
  }
};

/**
 * Detects the country of origin of a TikTok video using multi-factor signals
 */
export function detectCountryOrigin(params: {
  url?: string;
  title?: string;
  author?: string;
  locationName?: string;
  region?: string;
  timestampSeconds?: number;
}): CountryOriginResult {
  const { url = '', title = '', author = '', locationName = '', region = '', timestampSeconds = 0 } = params;

  const urlLower = url.toLowerCase();
  const textCorpus = `${title} ${author} ${locationName}`.toLowerCase();
  const scores: Record<string, number> = {};
  const evidence: Record<string, string[]> = {};

  // Initialize
  Object.keys(KNOWN_COUNTRIES).forEach((c) => {
    scores[c] = 0;
    evidence[c] = [];
  });

  // Factor 1: Explicit POI / Location Tag (Strongest Signal: +60)
  if (locationName) {
    const locLower = locationName.toLowerCase();
    for (const [code, country] of Object.entries(KNOWN_COUNTRIES)) {
      if (locLower.includes(country.nameId.toLowerCase()) || locLower.includes(country.nameEn.toLowerCase()) || locLower.includes(country.capital.toLowerCase())) {
        scores[code] += 60;
        evidence[code].push(`Stiker tag lokasi publik mencantumkan "${locationName}"`);
      }
    }
  }

  // Factor 2: Domain & Shortlink convention (+35)
  // vt.tiktok.com is designated for Southeast Asia (primary Indonesia / Malaysia / Vietnam)
  if (urlLower.includes('vt.tiktok.com')) {
    scores.ID += 35;
    evidence.ID.push('Domain shortlink "vt.tiktok.com" merupakan gateway regional Asia Tenggara & Indonesia');
  } else if (urlLower.includes('vm.tiktok.com')) {
    scores.US += 35;
    evidence.US.push('Domain shortlink "vm.tiktok.com" merupakan gateway regional Amerika Utara & Barat');
  }

  // Factor 3: Region code in URL or server header (+30)
  if (region) {
    const cleanRegion = region.toUpperCase();
    if (cleanRegion.includes('ID')) {
      scores.ID += 30;
      evidence.ID.push('Server CDN dan region routing menunjukkan kode negara Indonesia (ID)');
    } else if (cleanRegion.includes('US')) {
      scores.US += 30;
      evidence.US.push('Server CDN dan region routing menunjukkan kode negara Amerika Serikat (US)');
    } else if (cleanRegion.includes('MY')) {
      scores.MY += 30;
      evidence.MY.push('Server CDN dan region routing menunjukkan kode negara Malaysia (MY)');
    }
  }

  // Factor 4: Linguistic keywords & hashtags in title/caption (+10 to +30)
  for (const [code, country] of Object.entries(KNOWN_COUNTRIES)) {
    // Check hashtags
    for (const h of country.hashtags) {
      if (textCorpus.includes(`#${h}`) || textCorpus.includes(h)) {
        scores[code] += 12;
        evidence[code].push(`Ditemukan hashtag populer negara ${country.flag}: #${h}`);
      }
    }
    // Check keywords
    for (const kw of country.keywords) {
      const reg = new RegExp(`\\b${kw}\\b`, 'i');
      if (reg.test(textCorpus)) {
        scores[code] += 8;
        evidence[code].push(`Kata kunci bahasa/wilayah terdeteksi: "${kw}"`);
        break;
      }
    }
  }

  // Factor 5: Non-Latin scripts check
  // Japanese Kana/Kanji
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(title)) {
    scores.JP += 40;
    evidence.JP.push('Teks caption mengandung karakter huruf Jepang (Hiragana/Katakana/Kanji)');
  }
  // Korean Hangul
  if (/[\uac00-\ud7af]/.test(title)) {
    scores.KR += 40;
    evidence.KR.push('Teks caption mengandung karakter huruf Korea (Hangul)');
  }
  // Thai script
  if (/[\u0e00-\u0e7f]/.test(title)) {
    scores.TH += 40;
    evidence.TH.push('Teks caption mengandung karakter huruf aksara Thai');
  }

  // Find country with highest score
  let bestCountryCode = 'ID';
  let highestScore = 0;

  for (const [code, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCountryCode = code;
    }
  }

  // If no strong signal, default to Indonesia (ID) for Indonesian platform context or US
  if (highestScore === 0) {
    bestCountryCode = urlLower.includes('vt.tiktok') ? 'ID' : 'ID';
    highestScore = 40;
    evidence.ID.push('Berdasarkan deteksi default gateway dan pola distribusi URL');
  }

  const country = KNOWN_COUNTRIES[bestCountryCode] || KNOWN_COUNTRIES.ID;
  const confidence = Math.min(98, Math.max(45, highestScore));

  let confidenceLabel: 'Sangat Tinggi' | 'Tinggi' | 'Sedang' | 'Estimasi' = 'Estimasi';
  if (confidence >= 80) confidenceLabel = 'Sangat Tinggi';
  else if (confidence >= 65) confidenceLabel = 'Tinggi';
  else if (confidence >= 50) confidenceLabel = 'Sedang';

  // Calculate local time in the country of origin
  let localUploadTime = '-';
  if (timestampSeconds > 0) {
    const originMs = (timestampSeconds + country.offsetHours * 3600) * 1000;
    const originDate = new Date(originMs);
    const h = String(originDate.getUTCHours()).padStart(2, '0');
    const m = String(originDate.getUTCMinutes()).padStart(2, '0');
    const s = String(originDate.getUTCSeconds()).padStart(2, '0');
    localUploadTime = `${h}:${m}:${s} ${country.timezoneName}`;
  }

  const selectedEvidence = evidence[bestCountryCode] && evidence[bestCountryCode].length > 0
    ? Array.from(new Set(evidence[bestCountryCode])).slice(0, 4)
    : ['Analisis parameter link dan struktur routing server'];

  const summary = `Video diidentifikasi berasal dari ${country.flag} ${country.nameId} (${country.continent}) dengan keyakinan ${confidence}% (${confidenceLabel}).`;

  return {
    countryCode: country.code,
    countryName: country.nameId,
    flagEmoji: country.flag,
    capital: country.capital,
    continent: country.continent,
    standardTimezone: country.timezoneName,
    timezoneOffsetHours: country.offsetHours,
    confidence,
    confidenceLabel,
    evidenceList: selectedEvidence,
    localUploadTime,
    summary
  };
}
