import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChatRoomAccess } from '../src/pages/ChatRoom/chatRoomAccess.ts';

const joinedRoom = { roomId: '1', joined: true, name: '서울' };
const unjoinedRoom = { roomId: '2', joined: false, name: '부산' };

test('allows a room found as joined in the latest list', () => {
  assert.deepEqual(resolveChatRoomAccess([joinedRoom, unjoinedRoom], '1'), {
    status: 'joined',
    room: joinedRoom,
  });
});

test('requires membership when the latest list marks the room unjoined', () => {
  assert.deepEqual(resolveChatRoomAccess([joinedRoom, unjoinedRoom], '2'), {
    status: 'membership-required',
  });
});

test('returns not-found when the room is absent', () => {
  assert.deepEqual(resolveChatRoomAccess([joinedRoom], 'missing'), { status: 'not-found' });
});

test('uses the fresh list even when navigation state was previously joined', () => {
  const staleNavigationRoom = { ...unjoinedRoom, joined: true };
  const freshRooms = [{ ...staleNavigationRoom, joined: false }];

  assert.deepEqual(resolveChatRoomAccess(freshRooms, staleNavigationRoom.roomId), {
    status: 'membership-required',
  });
});
