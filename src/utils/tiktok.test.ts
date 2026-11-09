/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractVideoId,
  isShortUrl,
  extractAuthorHandle,
  getTimestampFromVideoId,
  formatUploadDateTime,
  getTimeOfDayCategory,
  evaluatePrimeTime,
  formatRelativeTime,
  getSnowflakeBitwiseInfo
} from './tiktok';

test('extractVideoId accurately pulls 19-digit video ID from various TikTok formats', () => {
  // Direct desktop video URL
  const u1 = 'https://www.tiktok.com/@tiktok/video/7106594312292453658';
  assert.equal(extractVideoId(u1), '7106594312292453658');

  // Video URL with tracking query params
  const u2 = 'https://www.tiktok.com/@username/video/7106594312292453658?is_from_webapp=1&sender_device=pc&q=fyp';
  assert.equal(extractVideoId(u2), '7106594312292453658');

  // Photo mode URL
  const u3 = 'https://www.tiktok.com/@creator/photo/7106594312292453658';
  assert.equal(extractVideoId(u3), '7106594312292453658');

  // Mobile m.tiktok.com
  const u4 = 'https://m.tiktok.com/v/7106594312292453658.html';
  assert.equal(extractVideoId(u4), '7106594312292453658');

  // Embed player URL
  const u5 = 'https://www.tiktok.com/player/v1/7106594312292453658';
  assert.equal(extractVideoId(u5), '7106594312292453658');

  // Raw Video ID
  const u6 = '7106594312292453658';
  assert.equal(extractVideoId(u6), '7106594312292453658');

  // Text message containing link
  const u7 = 'Halo bro tolong cek video ini ya https://www.tiktok.com/@tiktok/video/7106594312292453658 mantap';
  assert.equal(extractVideoId(u7), '7106594312292453658');
});

test('isShortUrl identifies mobile shortlinks', () => {
  assert.equal(isShortUrl('https://vt.tiktok.com/ZSjR1yWq/'), true);
  assert.equal(isShortUrl('https://vm.tiktok.com/ZGdabcde/'), true);
  assert.equal(isShortUrl('https://tiktok.com/t/ZT8y7441/'), true);
  assert.equal(isShortUrl('https://www.tiktok.com/@user/video/7106594312292453658'), false);
});

test('extractAuthorHandle extracts @username from TikTok URL', () => {
  assert.equal(extractAuthorHandle('https://www.tiktok.com/@albert_einstein/video/7106594312292453658'), '@albert_einstein');
  assert.equal(extractAuthorHandle('https://www.tiktok.com/@khaby.lame'), '@khaby.lame');
  assert.equal(extractAuthorHandle('7106594312292453658'), null);
});

test('getTimestampFromVideoId extracts the exact epoch timestamp via 64-bit snowflake shift', () => {
  const result = getTimestampFromVideoId('7106594312292453658');
  assert.ok(result);
  assert.equal(result.timestampSeconds, 1654632927);
  assert.equal(result.dateUtc.toUTCString(), 'Tue, 07 Jun 2022 20:15:27 GMT');
});

test('formatUploadDateTime formats Indonesian date and time for WIB (UTC+7)', () => {
  // 1654632927 UTC is Tue Jun 07 2022 20:15:27 GMT.
  // In WIB (UTC+7), it is Wednesday 8 June 2022 at 03:15:27!
  const formatted = formatUploadDateTime(1654632927, 7, 'id', 'WIB');
  assert.equal(formatted.dayName, 'Rabu');
  assert.equal(formatted.dayNumber, 8);
  assert.equal(formatted.monthName, 'Juni');
  assert.equal(formatted.year, 2022);
  assert.equal(formatted.hours, '03');
  assert.equal(formatted.minutes, '15');
  assert.equal(formatted.seconds, '27');
  assert.equal(formatted.formattedDate, '8 Juni 2022');
  assert.equal(formatted.formattedDateWithDay, 'Rabu, 8 Juni 2022');
  assert.equal(formatted.formattedTime, '03:15:27');
  assert.equal(formatted.timezoneLabel, 'WIB (UTC+7)');
});

test('getTimeOfDayCategory correctly categorizes hours', () => {
  assert.equal(getTimeOfDayCategory(3).category, 'Dini Hari');
  assert.equal(getTimeOfDayCategory(8).category, 'Pagi');
  assert.equal(getTimeOfDayCategory(12).category, 'Siang');
  assert.equal(getTimeOfDayCategory(16).category, 'Sore');
  assert.equal(getTimeOfDayCategory(20).category, 'Malam');
});

test('evaluatePrimeTime categorizes peak slots accurately', () => {
  const prime = evaluatePrimeTime(20, 2); // Tuesday 8 PM
  assert.equal(prime.rating, 'SUPER PRIME');

  const lunch = evaluatePrimeTime(12, 3); // Wednesday 12 PM
  assert.equal(lunch.rating, 'PRIME');

  const lateNight = evaluatePrimeTime(3, 1); // Monday 3 AM
  assert.equal(lateNight.rating, 'OFF-PEAK');
});

test('getSnowflakeBitwiseInfo provides 64-bit binary breakdown', () => {
  const info = getSnowflakeBitwiseInfo('7106594312292453658');
  assert.ok(info);
  assert.equal(info.binaryFull.length, 64);
  assert.equal(info.binaryTimestamp.length, 32);
  assert.equal(info.binaryWorker.length, 32);
  assert.equal(info.decimalTimestamp, 1654632927);
});
