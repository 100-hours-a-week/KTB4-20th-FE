/**
 * RFC 9562 UUIDv7 생성기. 채팅 메시지 전송 payload의 clientMessageId는
 * 백엔드가 UUID 버전이 7인지 검증하므로 crypto.randomUUID()(v4)를 사용할 수 없다.
 */
export function generateUuidV7(): string {
  const unixTimeMs = BigInt(Date.now());
  const bytes = new Uint8Array(16);

  bytes[0] = Number((unixTimeMs >> 40n) & 0xffn);
  bytes[1] = Number((unixTimeMs >> 32n) & 0xffn);
  bytes[2] = Number((unixTimeMs >> 24n) & 0xffn);
  bytes[3] = Number((unixTimeMs >> 16n) & 0xffn);
  bytes[4] = Number((unixTimeMs >> 8n) & 0xffn);
  bytes[5] = Number(unixTimeMs & 0xffn);

  const random = crypto.getRandomValues(new Uint8Array(10));
  bytes.set(random, 6);

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
