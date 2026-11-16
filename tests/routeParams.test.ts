import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidNumericRouteId } from '../src/utils/routeParams.ts';

test('accepts positive decimal route IDs', () => {
  assert.equal(isValidNumericRouteId('1'), true);
  assert.equal(isValidNumericRouteId('123'), true);
});

test('rejects malformed and non-positive route IDs', () => {
  for (const value of ['', '0', '-1', '1.5', ' 1', '1 ', 'abc', '12abc']) {
    assert.equal(isValidNumericRouteId(value), false, value);
  }
});
