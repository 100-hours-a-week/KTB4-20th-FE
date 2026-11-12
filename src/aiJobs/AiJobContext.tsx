import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getApiErrorCode } from '../api/errors';
import type { IncomingNotification } from '../api/notifications';
import {
  generateSchedule,
  SCHEDULE_ERROR_CODES,
  type ScheduleGenerationOutcome,
  type ScheduleGenerationReason,
} from '../api/schedule';
import { useAuth } from '../auth/AuthContext';
import AiJobProgressCard from '../components/AiJobProgressCard/AiJobProgressCard';
import { clearScheduleJob, loadScheduleJob, saveScheduleJob } from './scheduleJobStore';

/**
 * 일정 생성 진행 단계. 요청 전송 → AI 작업 중 → 완료 순서로 가고, 중간에 실패하거나 거절될 수 있다.
 * AI 작업의 중간 진행 정도는 알 수 없으므로 AI 작업 중은 한 단계로 둔다.
 */
export type ScheduleJobStage = 'sending' | 'running' | 'succeeded' | 'failed' | 'rejected';

export interface ScheduleJob {
  tripId: string;
  reason: ScheduleGenerationReason;
  stage: ScheduleJobStage;
  /** 접수(202)된 뒤에만 있다. */
  jobId?: string;
  /** 하단 진행 카드가 떠 있는지. 닫은 뒤 끝나면 카드 대신 알림 팝업으로 알린다. */
  cardOpen: boolean;
  /**
   * 응답을 3초 넘게 기다리는 중인지. 서버 전환 플래그가 꺼져 있으면 AI가 끝날 때까지 응답이 오지 않으므로,
   * 이때는 진행 카드 대신 기존 전체 화면 진행 표시를 보여준다.
   */
  waitingSyncResponse: boolean;
}

interface AiJobContextValue {
  scheduleJob: ScheduleJob | null;
  /**
   * 일정 생성을 요청하고 진행 카드를 띄운다. 접수(202)되면 카드가 AI 작업 중으로 바뀌고, 결과는 알림으로 받는다.
   * 503으로 거절되면 카드에 알린 뒤 오류를 그대로 던지고, 그 밖의 오류는 카드를 내리고 던져 화면이 처리하게 한다.
   */
  requestScheduleGeneration: (
    tripId: string,
    reason: ScheduleGenerationReason,
  ) => Promise<ScheduleGenerationOutcome>;
  /** 이 여행의 일정 생성이 요청 중이거나 AI 작업 중인지 */
  isScheduleGenerating: (tripId: string) => boolean;
  /**
   * 일정 생성 완료·실패 알림을 진행 중인 작업에 반영한다.
   * 진행 카드가 떠 있어 카드로 알렸으면 true를 돌려주고, 알림 팝업은 띄우지 않는다.
   */
  consumeNotification: (notification: IncomingNotification) => boolean;
}

const AiJobContext = createContext<AiJobContextValue | null>(null);

/** 202는 바로 오므로 이보다 오래 걸리면 기존 동기 응답을 기다리는 것으로 본다. */
const SYNC_RESPONSE_THRESHOLD_MS = 3_000;

const ACTIVE_STAGES: ScheduleJobStage[] = ['sending', 'running'];

function restoredJob(userPublicId: string | null): ScheduleJob | null {
  if (!userPublicId) return null;
  const stored = loadScheduleJob(userPublicId);
  if (!stored) return null;
  return {
    tripId: stored.tripId,
    reason: stored.reason,
    stage: 'running',
    jobId: stored.jobId,
    cardOpen: true,
    waitingSyncResponse: false,
  };
}

/**
 * 메시지 큐로 처리하는 AI 작업의 진행 상태를 앱 전체에서 관리한다.
 * 다른 화면으로 옮겨도 하단 진행 카드가 남고, 완료·실패 알림이 오면 카드를 바꾼다.
 */
export function AiJobProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userPublicId = status === 'authenticated' ? (user?.publicId ?? null) : null;
  const [scheduleJob, setScheduleJob] = useState<ScheduleJob | null>(() =>
    restoredJob(userPublicId),
  );
  // 알림 처리와 다시 시도는 렌더와 무관하게 최신 작업을 읽어야 하므로 ref로도 들고 있는다.
  const jobRef = useRef(scheduleJob);
  useEffect(() => {
    jobRef.current = scheduleJob;
  }, [scheduleJob]);

  // 로그인 사용자가 바뀌면 그 사용자가 접수해 둔 작업으로 바꾼다. 로그아웃하면 진행 카드를 내린다.
  const [previousUserPublicId, setPreviousUserPublicId] = useState(userPublicId);
  if (previousUserPublicId !== userPublicId) {
    setPreviousUserPublicId(userPublicId);
    setScheduleJob(restoredJob(userPublicId));
  }

  const requestScheduleGeneration = useCallback(
    async (tripId: string, reason: ScheduleGenerationReason) => {
      setScheduleJob({ tripId, reason, stage: 'sending', cardOpen: true, waitingSyncResponse: false });
      const syncTimer = window.setTimeout(() => {
        setScheduleJob((previous) =>
          previous?.tripId === tripId && previous.stage === 'sending'
            ? { ...previous, waitingSyncResponse: true }
            : previous,
        );
      }, SYNC_RESPONSE_THRESHOLD_MS);

      try {
        const outcome = await generateSchedule(tripId, reason);
        if (outcome.kind === 'accepted') {
          if (userPublicId) {
            saveScheduleJob(userPublicId, {
              tripId,
              jobId: outcome.job.jobId,
              reason,
              acceptedAt: Date.now(),
            });
          }
          setScheduleJob((previous) => ({
            tripId,
            reason,
            stage: 'running',
            jobId: outcome.job.jobId,
            cardOpen: previous?.cardOpen ?? true,
            waitingSyncResponse: false,
          }));
        } else {
          // 기존 동기 응답이면 이미 후보가 만들어졌다. 화면이 코스 화면으로 이동한다.
          setScheduleJob(null);
        }
        return outcome;
      } catch (error) {
        if (getApiErrorCode(error) === SCHEDULE_ERROR_CODES.temporarilyUnavailable) {
          setScheduleJob({ tripId, reason, stage: 'rejected', cardOpen: true, waitingSyncResponse: false });
        } else {
          setScheduleJob(null);
        }
        throw error;
      } finally {
        window.clearTimeout(syncTimer);
      }
    },
    [userPublicId],
  );

  const isScheduleGenerating = useCallback(
    (tripId: string) =>
      scheduleJob?.tripId === tripId && ACTIVE_STAGES.includes(scheduleJob.stage),
    [scheduleJob],
  );

  const consumeNotification = useCallback(
    (notification: IncomingNotification) => {
      const succeeded = notification.type === 'SCHEDULE_GENERATION_SUCCEEDED';
      if (!succeeded && notification.type !== 'SCHEDULE_GENERATION_FAILED') return false;
      const job = jobRef.current;
      // 여행 하나에는 진행 중인 일정 생성이 하나뿐이라 여행 ID로 내 작업의 결과인지 알 수 있다.
      if (!job || job.tripId !== notification.target?.id || !ACTIVE_STAGES.includes(job.stage)) {
        return false;
      }
      if (userPublicId) clearScheduleJob(userPublicId);
      const finished: ScheduleJob = { ...job, stage: succeeded ? 'succeeded' : 'failed' };
      jobRef.current = job.cardOpen ? finished : null;
      setScheduleJob(jobRef.current);
      return job.cardOpen;
    },
    [userPublicId],
  );

  const closeCard = useCallback(() => {
    setScheduleJob((previous) => {
      if (!previous) return previous;
      // 끝난 작업이나 거절된 요청은 카드를 닫으면 끝이다. 진행 중이면 결과를 알림으로 받도록 기억해 둔다.
      return ACTIVE_STAGES.includes(previous.stage) ? { ...previous, cardOpen: false } : null;
    });
  }, []);

  const retry = useCallback(() => {
    const job = jobRef.current;
    if (!job) return;
    requestScheduleGeneration(job.tripId, job.reason).catch((error: unknown) => {
      if (getApiErrorCode(error) === SCHEDULE_ERROR_CODES.temporarilyUnavailable) return;
      // 카드에서 다시 시도했다가 다른 이유로 거절되면 카드에 실패로 남겨 이유를 보여준다.
      setScheduleJob({
        tripId: job.tripId,
        reason: job.reason,
        stage: 'failed',
        cardOpen: true,
        waitingSyncResponse: false,
      });
    });
  }, [requestScheduleGeneration]);

  const value = useMemo<AiJobContextValue>(
    () => ({ scheduleJob, requestScheduleGeneration, isScheduleGenerating, consumeNotification }),
    [scheduleJob, requestScheduleGeneration, isScheduleGenerating, consumeNotification],
  );

  return (
    <AiJobContext.Provider value={value}>
      {children}
      {scheduleJob?.cardOpen && !scheduleJob.waitingSyncResponse && (
        <AiJobProgressCard job={scheduleJob} onClose={closeCard} onRetry={retry} />
      )}
    </AiJobContext.Provider>
  );
}

export function useAiJobs(): AiJobContextValue {
  const context = useContext(AiJobContext);
  if (!context) {
    throw new Error('useAiJobs는 AiJobProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
