/*
  업로드할 사진을 백엔드 조건에 맞춥니다.
  백엔드는 JPEG·PNG·WebP만, 5MB까지 받아요. 조건에 맞으면 원본을 그대로 보내고,
  아니면(HEIC 등 다른 형식이거나 5MB 초과) 긴 변 2048px JPEG로 줄여요.
  줄이면 사진 속 위치 정보(EXIF)가 지워지므로 위치는 줄이기 전에 따로 읽어 둬야 해요.
*/

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 2048;

export class UnsupportedImageError extends Error {}

export async function prepareUploadImage(file: File): Promise<Blob> {
  if (ALLOWED_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;

  const source = await decodeImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new UnsupportedImageError();
  context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
  source.close();

  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new UnsupportedImageError();
}

interface DecodedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

/** 사진 방향(EXIF Orientation)을 반영해 그려요. 브라우저가 못 여는 형식이면 UnsupportedImageError예요. */
async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    // createImageBitmap을 못 쓰는 브라우저는 <img>로 다시 시도해요.
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new UnsupportedImageError();
  }
}
