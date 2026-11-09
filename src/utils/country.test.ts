/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCountryOrigin } from './country';

test('detectCountryOrigin detects Indonesia from vt.tiktok.com link and Indonesian hashtags', () => {
  const result = detectCountryOrigin({
    url: 'https://vt.tiktok.com/ZSjR1yWq/',
    title: 'Resep mie pedas viral enak banget #kulinerindonesia #fyp',
    timestampSeconds: 1654632927
  });

  assert.equal(result.countryCode, 'ID');
  assert.equal(result.flagEmoji, '🇮🇩');
  assert.equal(result.countryName, 'Indonesia');
  assert.ok(result.confidence >= 65);
  assert.ok(result.evidenceList.length > 0);
});

test('detectCountryOrigin detects Japan from Japanese characters', () => {
  const result = detectCountryOrigin({
    url: 'https://www.tiktok.com/@tokyo_user/video/7106594312292453658',
    title: '今日のランチはラーメンです！おすすめ #日本',
    timestampSeconds: 1654632927
  });

  assert.equal(result.countryCode, 'JP');
  assert.equal(result.flagEmoji, '🇯🇵');
  assert.equal(result.countryName, 'Jepang');
  assert.ok(result.confidence >= 50);
});

test('detectCountryOrigin detects United States from vm.tiktok.com', () => {
  const result = detectCountryOrigin({
    url: 'https://vm.tiktok.com/ZM8abcde/',
    title: 'Crazy moments in NYC #foryoupage #usa',
    timestampSeconds: 1654632927
  });

  assert.equal(result.countryCode, 'US');
  assert.equal(result.flagEmoji, '🇺🇸');
  assert.equal(result.countryName, 'Amerika Serikat');
});

test('detectCountryOrigin calculates local time in origin country', () => {
  // 1654632927 UTC is 20:15:27 UTC.
  // In Japan (UTC+9), it is 05:15:27 JST!
  const result = detectCountryOrigin({
    locationName: 'Tokyo, Japan',
    timestampSeconds: 1654632927
  });

  assert.equal(result.countryCode, 'JP');
  assert.ok(result.localUploadTime.includes('05:15:27'));
  assert.ok(result.localUploadTime.includes('JST'));
});
