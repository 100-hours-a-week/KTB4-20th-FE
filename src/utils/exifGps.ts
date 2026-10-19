/*
  JPEG 사진의 EXIF에서 촬영 위치(GPS)만 꺼냅니다.
  아이폰 사파리는 사용자가 사진 선택 화면의 "옵션"에서 위치 포함을 켰을 때만 위치가 남아 있어요.
  위치가 없거나 JPEG가 아니면 null을 돌려줘요.
*/

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

/** EXIF는 파일 앞부분에 있어서 앞쪽만 읽어요. */
const EXIF_SCAN_BYTES = 256 * 1024;

const TAG_GPS_IFD = 0x8825;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LON_REF = 0x0003;
const TAG_GPS_LON = 0x0004;
const TYPE_RATIONAL = 5;

export async function readExifGps(file: Blob): Promise<GpsCoordinates | null> {
  try {
    const buffer = await file.slice(0, EXIF_SCAN_BYTES).arrayBuffer();
    return parseJpegGps(new DataView(buffer));
  } catch {
    return null;
  }
}

function parseJpegGps(view: DataView): GpsCoordinates | null {
  // JPEG 시작 표시(FFD8)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);
    // APP1(FFE1) 안의 "Exif\0\0"
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) {
      return parseTiff(view, offset + 10);
    }
    if ((marker & 0xff00) !== 0xff00 || length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function parseTiff(view: DataView, tiffStart: number): GpsCoordinates | null {
  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  const u16 = (at: number) => view.getUint16(tiffStart + at, littleEndian);
  const u32 = (at: number) => view.getUint32(tiffStart + at, littleEndian);

  const ifd0 = u32(4);
  const gpsIfd = findEntryValue(u16, u32, ifd0, TAG_GPS_IFD);
  if (gpsIfd === null) return null;

  const entryCount = u16(gpsIfd);
  let latRef = '';
  let lonRef = '';
  let lat: number | null = null;
  let lon: number | null = null;
  for (let i = 0; i < entryCount; i += 1) {
    const entry = gpsIfd + 2 + i * 12;
    const tag = u16(entry);
    const type = u16(entry + 2);
    if (tag === TAG_GPS_LAT_REF) latRef = String.fromCharCode(view.getUint8(tiffStart + entry + 8));
    if (tag === TAG_GPS_LON_REF) lonRef = String.fromCharCode(view.getUint8(tiffStart + entry + 8));
    if ((tag === TAG_GPS_LAT || tag === TAG_GPS_LON) && type === TYPE_RATIONAL) {
      const valueOffset = u32(entry + 8);
      const rational = (index: number) => {
        const denominator = u32(valueOffset + index * 8 + 4);
        return denominator === 0 ? 0 : u32(valueOffset + index * 8) / denominator;
      };
      const degrees = rational(0) + rational(1) / 60 + rational(2) / 3600;
      if (tag === TAG_GPS_LAT) lat = degrees;
      else lon = degrees;
    }
  }
  if (lat === null || lon === null || (lat === 0 && lon === 0)) return null;
  return {
    latitude: latRef === 'S' ? -lat : lat,
    longitude: lonRef === 'W' ? -lon : lon,
  };
}

function findEntryValue(
  u16: (at: number) => number,
  u32: (at: number) => number,
  ifdOffset: number,
  tag: number,
): number | null {
  const entryCount = u16(ifdOffset);
  for (let i = 0; i < entryCount; i += 1) {
    const entry = ifdOffset + 2 + i * 12;
    if (u16(entry) === tag) return u32(entry + 8);
  }
  return null;
}
