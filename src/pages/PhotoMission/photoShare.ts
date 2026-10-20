import { toast } from 'sonner';

/*
  사진 공유·저장. 앱 자체 공유 화면 없이 휴대폰 기본 공유 시트를 써요.
  사진 파일을 함께 보내려면 사진 주소(S3)가 이 사이트에서 읽을 수 있게 열려 있어야 해서(CORS),
  못 읽으면 글만 공유하거나 주소를 새 창으로 열어요.
*/

/*
  사파리는 버튼을 누른 직후에만 공유 시트를 열어 줘서, 화면이 열릴 때 사진 파일을 미리 받아 둬요.
  (누른 뒤에 받으면 시간이 지나 공유가 거절될 수 있어요)
*/
const fileCache = new Map<string, Promise<File | null>>();

/** 화면이 열릴 때 불러 두면 공유·저장이 바로 돼요. */
export function warmPhotoFiles(imageUrls: string[]): void {
  imageUrls.forEach((url, index) => void toFile(url, index));
}

function toFile(url: string, index: number): Promise<File | null> {
  let cached = fileCache.get(url);
  if (!cached) {
    cached = fetchFile(url, index);
    fileCache.set(url, cached);
  }
  return cached;
}

async function fetchFile(url: string, index: number): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const extension =
      blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `planit-mission-${index + 1}.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * 사진들을 공유 시트로 보내요. 사진 파일을 못 보내면 링크와 글을 보내요.
 * 공유 시트가 없는 브라우저(대부분의 PC)에서는 링크를 복사해요. 링크는 여행방 멤버만 열 수 있어요.
 */
export async function sharePhotos(imageUrls: string[], text: string, url: string): Promise<void> {
  try {
    const files = (await Promise.all(imageUrls.map(toFile))).filter((file): file is File => !!file);
    if (files.length > 0 && navigator.canShare?.({ files })) {
      await navigator.share({ files, text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ text, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('링크를 복사했어요. 멤버들에게 보내 주세요.');
  } catch (error) {
    if (isAbort(error)) return;
    // 파일 공유가 거절되면(사파리의 누른 직후 제한 등) 글만 다시 공유해 봐요.
    if (error instanceof DOMException && error.name === 'NotAllowedError' && navigator.share) {
      await navigator.share({ text, url }).catch(() => undefined);
      return;
    }
    toast.error('공유하지 못했어요. 다시 시도해 주세요.');
  }
}

/** 사진들을 한 장씩 기기에 저장해요. 파일로 못 받으면 새 창으로 열어 길게 눌러 저장하게 해요. */
export async function savePhotos(imageUrls: string[]): Promise<void> {
  let saved = 0;
  for (const [index, url] of imageUrls.entries()) {
    const file = await toFile(url, index);
    if (!file) continue;
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    link.click();
    // 다운로드가 시작될 시간을 준 뒤 해제해요.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    saved += 1;
  }
  if (saved === imageUrls.length) {
    toast.success(saved > 1 ? `사진 ${saved}장을 저장했어요.` : '사진을 저장했어요.');
  } else if (imageUrls.length === 1) {
    window.open(imageUrls[0], '_blank', 'noopener');
  } else {
    toast.error('일부 사진을 저장하지 못했어요. 사진을 열어 길게 눌러 저장해 주세요.');
  }
}
