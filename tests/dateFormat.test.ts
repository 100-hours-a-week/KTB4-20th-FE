import assert from 'node:assert/strict';
import test from 'node:test';
import { formatKoreanYearMonth } from '../src/utils/date.ts';

test('formats a zero-based month as a Korean year-month title', () => {
  assert.equal(formatKoreanYearMonth(2026, 9), '2026년 10월');
  assert.equal(formatKoreanYearMonth(2027, 0), '2027년 1월');
});
