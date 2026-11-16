import { XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type {
  PhotoEvaluationJob,
  PhotoEvaluationJobStage,
  ScheduleJob,
  ScheduleJobStage,
} from '../../aiJobs/AiJobContext';
import styles from './AiJobProgressCard.module.css';

interface StageCopy {
  title: string;
  description: string;
  /** 트랙 아래 세 단계 중 지금 위치(0: 요청 전송, 1: AI 작업 중, 2: 완료) */
  position: 0 | 1 | 2;
  failed: boolean;
}

const SCHEDULE_COPY: Record<ScheduleJobStage, StageCopy> = {
  sending: {
    title: '일정을 요청하고 있어요',
    description: '잠시만 기다려 주세요',
    position: 0,
    failed: false,
  },
  running: {
    title: 'AI가 일정을 만들고 있어요',
    description: '다른 화면으로 이동해도 완료되면 알려드려요',
    position: 1,
    failed: false,
  },
  succeeded: {
    title: '일정이 완성됐어요',
    description: 'AI가 만든 코스 3가지를 확인해 보세요',
    position: 2,
    failed: false,
  },
  failed: {
    title: '일정을 만들지 못했어요',
    description: '잠시 후 다시 시도해 주세요',
    position: 1,
    failed: true,
  },
  rejected: {
    title: '요청이 많아 잠시 후 다시 시도해 주세요',
    description: '일정 요청은 접수되지 않았어요',
    position: 0,
    failed: true,
  },
};

const PHOTO_COPY: Record<PhotoEvaluationJobStage, StageCopy> = {
  sending: {
    title: '사진을 보내고 있어요',
    description: '잠시만 기다려 주세요',
    position: 0,
    failed: false,
  },
  running: {
    title: 'AI가 사진을 판정하고 있어요',
    description: '다른 화면으로 이동해도 완료되면 알려드려요',
    position: 1,
    failed: false,
  },
  succeeded: {
    title: '포토미션 판정이 끝났어요',
    description: '미션 결과를 확인해 보세요',
    position: 2,
    failed: false,
  },
  failed: {
    title: '사진을 판정하지 못했어요',
    description: '사진을 확인하고 다시 시도해 주세요',
    position: 1,
    failed: true,
  },
};

const STEP_LABELS = ['요청 전송', 'AI 작업 중', '완료'] as const;
const PHOTO_STEP_LABELS = ['사진 전송', 'AI 판정 중', '완료'] as const;

function stepLabel(stage: ScheduleJobStage, index: number): string {
  if (stage === 'rejected' && index === 0) return '요청 실패';
  if (stage === 'failed' && index === 1) return 'AI 작업 실패';
  return STEP_LABELS[index];
}

interface AiJobProgressCardProps {
  job: ScheduleJob | PhotoEvaluationJob;
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * 하단 내비게이션 위에 뜨는 AI 일정 생성 진행 카드.
 * AI 작업의 중간 진행 정도는 알 수 없어서 트랙은 단계 위치까지만 채운다.
 */
export default function AiJobProgressCard({ job, onClose, onRetry }: AiJobProgressCardProps) {
  const navigate = useNavigate();
  const photoEvaluation = job.kind === 'photoEvaluation';
  const copy = photoEvaluation ? PHOTO_COPY[job.stage] : SCHEDULE_COPY[job.stage];
  const closable = job.stage !== 'sending';

  const goToResult = () => {
    onClose();
    navigate(
      photoEvaluation
        ? `/photo-missions/missions/${encodeURIComponent(job.missionId)}`
        : `/trips/${encodeURIComponent(job.tripId)}/courses`,
    );
  };

  const retry = () => {
    if (photoEvaluation) goToResult();
    else onRetry?.();
  };

  return (
    <div className={styles.wrapper}>
      <section
        className={styles.card}
        data-failed={copy.failed || undefined}
        role="status"
        aria-live="polite"
        aria-label={photoEvaluation ? '포토미션 AI 판정 진행 상황' : 'AI 일정 생성 진행 상황'}
      >
        <div className={styles.header}>
          <div className={styles.text}>
            <p className={styles.title}>{copy.title}</p>
            <p className={styles.description}>{copy.description}</p>
          </div>
          {closable && (
            <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className={styles.track} data-position={copy.position} aria-hidden="true">
          <span className={styles.fill} />
          {(photoEvaluation ? PHOTO_STEP_LABELS : STEP_LABELS).map((label, index) => (
            <span
              key={label}
              className={styles.dot}
              data-index={index}
              data-reached={index <= copy.position || undefined}
            />
          ))}
        </div>
        <ol className={styles.steps}>
          {(photoEvaluation ? PHOTO_STEP_LABELS : STEP_LABELS).map((label, index) => (
            <li
              key={label}
              data-reached={index <= copy.position || undefined}
              aria-current={index === copy.position ? 'step' : undefined}
            >
              {photoEvaluation ? label : stepLabel(job.stage, index)}
            </li>
          ))}
        </ol>

        {job.stage === 'succeeded' && (
          <Button className={styles.action} onClick={goToResult}>
            {photoEvaluation ? '결과 확인하기' : '코스 보러가기'}
          </Button>
        )}
        {job.stage === 'failed' && (
          <div className={styles.actions}>
            <Button variant="secondary" className={styles.action} onClick={onClose}>
              닫기
            </Button>
            <Button className={styles.action} onClick={retry}>
              다시 시도하기
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
