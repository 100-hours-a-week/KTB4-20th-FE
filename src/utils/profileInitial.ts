/*
  프로필 사진이 없을 때 보여줄 글자를 정합니다.
  한국 이름은 성을 빼고 이름의 첫 글자를 씁니다. (예: 김채령 → 채, 남궁민수 → 민)
  영어 등 다른 이름은 첫 글자를 대문자로 씁니다. (예: Daniel → D)
*/

/** 두 글자 성. 이 목록에 있으면 앞 두 글자를 성으로 봅니다. */
const TWO_LETTER_SURNAMES = [
  '남궁',
  '황보',
  '제갈',
  '선우',
  '독고',
  '사공',
  '서문',
  '동방',
  '어금',
  '망절',
];

const HANGUL_NAME = /^[가-힣]+$/;

export function getProfileInitial(name: string): string {
  const trimmed = name.trim();
  const characters = Array.from(trimmed);
  if (characters.length === 0) return '';

  if (HANGUL_NAME.test(trimmed)) {
    // 두 글자 이하는 성과 이름을 나누기 어려워서(예: 민지) 첫 글자를 씁니다.
    if (characters.length <= 2) return characters[0];
    const surnameLength =
      characters.length >= 4 && TWO_LETTER_SURNAMES.includes(characters.slice(0, 2).join(''))
        ? 2
        : 1;
    return characters[surnameLength];
  }

  return characters[0].toUpperCase();
}

/**
 * 백엔드는 사진이 없는 사용자에게도 기본 프로필 이미지 주소를 보냅니다.
 * 이 주소면 "사진 없음"으로 보고 글자를 보여줍니다.
 */
const DEFAULT_PROFILE_IMAGE_PATH = '/images/default-profile.svg';

export function isDefaultProfileImage(imageUrl: string): boolean {
  try {
    return new URL(imageUrl, window.location.origin).pathname.endsWith(DEFAULT_PROFILE_IMAGE_PATH);
  } catch {
    return false;
  }
}
