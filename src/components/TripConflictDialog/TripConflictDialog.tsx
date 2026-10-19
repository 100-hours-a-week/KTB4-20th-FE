import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { TripConflict } from '../../api/trips';
import AlertDialog from '../AlertDialog/AlertDialog';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { truncateTripName } from '../TripCard/tripFormat';
import { formatMonthDay } from '../../utils/date';

const TITLE = '날짜가 겹치는 여행이 있어요';

/** "10월 14일~10월 15일", 하루 여행이면 "10월 14일" */
function formatPeriod({ startDate, endDate }: TripConflict): string {
  if (startDate === endDate) return formatMonthDay(startDate);
  return `${formatMonthDay(startDate)}~${formatMonthDay(endDate)}`;
}

interface TripConflictDialogProps {
  /** 날짜가 겹치는 기존 여행방. null이면 닫혀 있어요. */
  conflict: TripConflict | null;
  /** 새 여행방을 만들 때는 'create', 초대받은 여행방에 참여할 때는 'join' */
  mode: 'create' | 'join';
  /** 기존 여행방에서 나가기로 하고 이어서 진행합니다. */
  onContinue: () => void;
  /** 기존 여행방을 유지합니다. (만들기: 겹치는 선택을 되돌림, 참여: 메인으로) */
  onCancel: () => void;
}

/**
 * 날짜가 하루라도 겹치는, 이미 참여 중인 여행이 있을 때 띄우는 팝업입니다.
 * 겹치는 기간과 여행방 이름을 알려주고, 출발 전이면 나갈지 유지할지 묻고, 이미 시작했으면 나갈 수 없다고 알려줘요.
 */
export default function TripConflictDialog({
  conflict,
  mode,
  onContinue,
  onCancel,
}: TripConflictDialogProps) {
  // 닫히는 동안에도 내용이 비지 않도록 마지막으로 보여준 여행방을 기억해 둡니다.
  const [shown, setShown] = useState(conflict);
  if (conflict && conflict !== shown) setShown(conflict);
  // 어떤 여행방이 언제와 겹치는지 한 줄로 짧게 알려줘요.
  const overlap = shown ? `'${truncateTripName(shown.name)}' · ${formatPeriod(shown)}` : '';

  if (shown && !shown.canLeave) {
    return (
      <AlertDialog
        open={conflict !== null}
        title={TITLE}
        description={`${overlap}\n이미 시작해서 나갈 수 없어요`}
        primaryAction={{
          label: mode === 'create' ? '확인' : '메인으로 가기',
          onClick: onCancel,
        }}
        onClose={onCancel}
      />
    );
  }

  return (
    <ConfirmDialog
      open={conflict !== null}
      icon={<CalendarIcon size={18} />}
      title={TITLE}
      description={`${overlap}\n${mode === 'create' ? '이 여행방에서 나갈까요?' : '나가야 참여할 수 있어요'}`}
      cancelAction={{ label: '유지하기', onClick: onCancel }}
      confirmAction={{
        label: mode === 'create' ? '나가기' : '나가고 참여하기',
        onClick: onContinue,
      }}
      onClose={onCancel}
    />
  );
}
