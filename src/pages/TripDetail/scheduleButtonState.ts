import { getToday } from '../../utils/date';

const seoulDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 설문 마감까지 남은 날짜를 "D-3", 당일이면 "D-Day"로 돌려줍니다. (서울 기준) */
export function formatDeadlineDday(deadlineAt: string): string {
  const deadlineDate = seoulDateFormatter.format(new Date(deadlineAt));
  const days = Math.round(
    (Date.parse(`${deadlineDate}T00:00:00Z`) - Date.parse(`${getToday()}T00:00:00Z`)) / 86_400_000,
  );
  return days <= 0 ? 'D-Day' : `D-${days}`;
}

/** AI 일정은 여러 명의 취향을 합쳐 만들기 때문에, 이 인원 이상이어야 만들 수 있습니다. */
const MIN_MEMBERS_FOR_SCHEDULE = 2;

interface ScheduleButtonInput {
  isHost: boolean;
  /** 지금 여행방에 참여 중인 인원 */
  memberCount: number;
  mySurveySubmitted: boolean;
  allSubmitted: boolean;
  deadlinePassed: boolean;
  remainingCount: number;
  deadlineAt: string;
}

/**
 * AI 일정 생성하기 버튼의 활성 여부와 안내 문구 (화면설계서 7번)
 * - 그룹원은 조건과 관계없이 비활성화
 * - 참여 인원이 1명(방장 혼자) → 비활성 · "멤버가 2명 이상이어야 일정을 만들 수 있어요"
 * - 본인 미제출 → 비활성 · "먼저 취향 설문에 답해주세요· 마감 D-{d}"
 * - 마감 전 · 미제출자 있음 → 비활성 · "{n}명이 더 제출하면 시작할 수 있어요 · 마감 D-{d}"
 * - 마감 전 · 전원 제출 → 활성 · "모두 제출했어요. 이제 일정을 만들 수 있어요"
 * - 마감 경과 · 미제출자 있음 → 활성 · "설문이 마감됐어요. 지금 인원으로 일정을 만들어요"
 * - 마감 경과 · 전원 제출 → 활성 · "모두 제출했어요. 이제 일정을 만들 수 있어요"
 */
export function getScheduleButtonState({
  isHost,
  memberCount,
  mySurveySubmitted,
  allSubmitted,
  deadlinePassed,
  remainingCount,
  deadlineAt,
}: ScheduleButtonInput): { enabled: boolean; caption: string } {
  const dday = formatDeadlineDday(deadlineAt);

  if (memberCount < MIN_MEMBERS_FOR_SCHEDULE) {
    return {
      enabled: false,
      caption: '멤버가 2명 이상이어야 일정을 만들 수 있어요. 친구를 초대해 보세요',
    };
  }

  if (!mySurveySubmitted) {
    return { enabled: false, caption: `먼저 취향 설문에 답해주세요· 마감 ${dday}` };
  }

  let ready: boolean;
  let caption: string;
  if (allSubmitted) {
    ready = true;
    caption = '모두 제출했어요. 이제 일정을 만들 수 있어요';
  } else if (deadlinePassed) {
    ready = true;
    caption = '설문이 마감됐어요. 지금 인원으로 일정을 만들어요';
  } else {
    ready = false;
    caption = `${remainingCount}명이 더 제출하면 시작할 수 있어요 · 마감 ${dday}`;
  }

  return { enabled: isHost && ready, caption };
}
