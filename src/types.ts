/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormattedDateTimeResult, TimeOfDayInfo, PrimeTimeAnalysis, SnowflakeInfo } from './utils/tiktok';
import { CountryOriginResult } from './utils/country';

export interface TimezoneOption {
  id: string;
  label: string;
  offsetHours: number;
  fullName: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'WIB', label: 'WIB (UTC+7)', offsetHours: 7, fullName: 'Waktu Indonesia Barat (Jakarta)' },
  { id: 'WITA', label: 'WITA (UTC+8)', offsetHours: 8, fullName: 'Waktu Indonesia Tengah (Bali/Makassar)' },
  { id: 'WIT', label: 'WIT (UTC+9)', offsetHours: 9, fullName: 'Waktu Indonesia Timur (Jayapura)' },
  { id: 'UTC', label: 'UTC (GMT+0)', offsetHours: 0, fullName: 'Coordinated Universal Time' },
  { id: 'LOCAL', label: 'Lokal Perangkat', offsetHours: -new Date().getTimezoneOffset() / 60, fullName: 'Waktu Lokal Browser' },
];

export interface VideoAnalysisResult {
  videoId: string;
  originalUrl: string;
  resolvedUrl: string;
  author?: string;
  title?: string;
  locationName?: string;
  region?: string;
  countryOrigin: CountryOriginResult;
  thumbnailUrl?: string;
  embedHtml?: string;
  timestampSeconds: number;
  timestampMs: number;
  timeInfo: FormattedDateTimeResult;
  timeOfDay: TimeOfDayInfo;
  primeTime: PrimeTimeAnalysis;
  relativeTime: string;
  snowflake: SnowflakeInfo | null;
  analyzedAt: number;
}

export type ActiveTab = 'single' | 'batch' | 'bot' | 'snowflake';
export type AppLanguage = 'id' | 'en';
