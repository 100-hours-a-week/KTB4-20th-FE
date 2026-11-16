import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChatWebSocketUrl } from '../src/realtime/chatSocketUrl.ts';

test('builds a secure WebSocket URL from a relative API base', () => {
  assert.equal(buildChatWebSocketUrl('/api', 'https://planit-ai.site'), 'wss://planit-ai.site/ws');
});

test('preserves the host from an absolute HTTPS API base', () => {
  assert.equal(
    buildChatWebSocketUrl('https://api.planit-ai.site/api', 'https://planit-ai.site'),
    'wss://api.planit-ai.site/ws',
  );
});

test('uses ws for an HTTP origin', () => {
  assert.equal(buildChatWebSocketUrl('/api', 'http://localhost:5173'), 'ws://localhost:5173/ws');
});
