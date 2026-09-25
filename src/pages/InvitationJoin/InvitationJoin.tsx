import axios from 'axios';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import {
  getInvitationPreview,
  INVITATION_ERROR_CODES,
  type InvitationPreview,
} from '../../api/invitations';
import {
  HOST_CANNOT_LEAVE_ALONE,
  isValidInvitationToken,
  joinTrip,
  leaveTrip,
  TRIP_JOIN_ERROR_CODES,
} from '../../api/trips';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Avatar, { AvatarGroup } from '../../components/Avatar/Avatar';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import {
  CircleAlertIcon as AlertIcon,
  CalendarIcon,
  XIcon as CloseIcon,
  LockIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { truncateTripName } from '../../components/TripCard/tripFormat';
import { getDestinationName } from '../../constants/regions';
import { useAuth } from '../../auth/AuthContext';
import { formatDotDate } from '../../utils/date';
import { withSubjectParticle } from '../../utils/korean';
import { clearPendingInvitation, savePendingInvitation } from '../../utils/pendingInvitation';
import styles from './InvitationJoin.module.css';

const MAX_VISIBLE_MEMBERS = 3;

type ErrorKind = 'deleted' | 'full' | 'surveyClosed' | 'invalid' | 'unknown';

interface ErrorContent {
  icon: ReactNode;
  title: string;
  description: string;
}

/** 설계서 7~10번 오류 화면과 공통 오류 화면 */
function getErrorContent(kind: ErrorKind, capacity?: number): ErrorContent {
  switch (kind) {
    case 'deleted':
      return {
        icon: <CloseIcon size={20} strokeWidth={1.6} />,
        title: '사라진 방이에요',
        description: '방장이 이 여행방을 삭제했어요',
      };
    case 'full':
      return {
        icon: <UsersIcon size={20} strokeWidth={1.6} />,
        title: '인원이 다 찼어요',
        description: capacity
          ? `이 방은 ${capacity}명 정원이 모두 찼어요.`
          : '이 방은 정원이 모두 찼어요.',
      };
    case 'surveyClosed':
      return {
        icon: <LockIcon size={20} />,
        title: '설문이 마감된 방이에요',
        description: '이미 일정 생성이 끝나서\n새로 참여할 수 없어요',
      };
    case 'invalid':
      return {
        icon: <AlertIcon size={20} strokeWidth={1.6} />,
        title: '잘못된 링크예요',
        description: '링크가 정확한지 확인하거나\n친구에게 다시 받아보세요',
      };
    case 'unknown':
      return {
        icon: <AlertIcon size={20} strokeWidth={1.6} />,
        title: '여행방에 들어가지 못했어요',
        description: '잠시 후 다시 시도해 주세요',
      };
  }
}

/** 초대 미리보기 오류 코드를 오류 화면 종류로 바꿉니다. */
function toErrorKind(error: unknown): ErrorKind {
  switch (getApiErrorCode(error)) {
    case INVITATION_ERROR_CODES.notFound:
    case INVITATION_ERROR_CODES.expired:
    case TRIP_JOIN_ERROR_CODES.notFound:
      return 'invalid';
    case INVITATION_ERROR_CODES.tripDeleted:
      return 'deleted';
    case INVITATION_ERROR_CODES.surveyClosed:
      return 'surveyClosed';
    case TRIP_JOIN_ERROR_CODES.capacityExceeded:
      return 'full';
    default:
      return axios.isAxiosError(error) && error.response?.status === 400 ? 'invalid' : 'unknown';
  }
}

function isTimeout(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED';
}

/** 3초 안에 응답이 없으면 한 번 더 요청합니다. (설계서 6-c) */
async function retryOnTimeout<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!isTimeout(error)) throw error;
    return request();
  }
}

/** 링크 확인 결과: 확인 중 / 유효함(로그인 필요) / 오류 */
type Validation =
  { status: 'checking' } | { status: 'valid' } | { status: 'error'; kind: ErrorKind };

/**
 * 초대 링크(`/invitations/{토큰}`)로 들어온 사람이 여행방에 참여하는 화면입니다.
 * 1) 로그인 토큰 없이 링크가 유효한지 먼저 확인하고 (만료된 토큰이 섞이지 않도록)
 * 2) 로그인한 상태라면 토큰을 붙여 여행 정보를 다시 조회합니다.
 */
export default function InvitationJoin() {
  const { invitationToken = '' } = useParams();
  const isTokenFormatValid = isValidInvitationToken(invitationToken);

  if (!isTokenFormatValid) {
    // 형식이 틀린 링크는 서버에 묻지 않고, 로그인보다 먼저 알려줍니다. (설계서 10-d)
    return <ErrorScreen kind="invalid" />;
  }

  return <InvitationFlow key={invitationToken} invitationToken={invitationToken} />;
}

function InvitationFlow({ invitationToken }: { invitationToken: string }) {
  const location = useLocation();
  const { status: authStatus } = useAuth();
  const [validation, setValidation] = useState<Validation>({ status: 'checking' });

  // 1단계: 로그인 토큰 없이 링크가 유효한지 확인합니다.
  useEffect(() => {
    let active = true;
    retryOnTimeout(() => getInvitationPreview(invitationToken, { withAuth: false })).then(
      // 로그인 없이도 정보가 오면 유효한 링크로 봅니다.
      () => active && setValidation({ status: 'valid' }),
      (error: unknown) => {
        if (!active) return;
        if (getApiErrorCode(error) === INVITATION_ERROR_CODES.authenticationRequired) {
          setValidation({ status: 'valid' });
        } else {
          setValidation({ status: 'error', kind: toErrorKind(error) });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [invitationToken]);

  useEffect(() => {
    if (validation.status !== 'valid') return;
    if (authStatus === 'authenticated') clearPendingInvitation();
    if (authStatus === 'unauthenticated') savePendingInvitation(location.pathname);
  }, [validation.status, authStatus, location.pathname]);

  if (validation.status === 'error') {
    return <ErrorScreen kind={validation.kind} />;
  }

  if (validation.status === 'checking' || authStatus === 'loading') {
    return <LoadingScreen title="여행방에 입장 중이에요" description="잠시만 기다려주세요" />;
  }

  if (authStatus === 'unauthenticated') {
    const params = new URLSearchParams({ returnTo: location.pathname });
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  return <InvitationDetail invitationToken={invitationToken} />;
}

/** 2단계: 로그인한 사용자에게 여행 정보를 보여주고 참여를 받습니다. */
function InvitationDetail({ invitationToken }: { invitationToken: string }) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isConflictDismissed, setIsConflictDismissed] = useState(false);
  const [notice, setNotice] = useState<{ title: string; description?: string } | null>(null);
  const joiningRef = useRef(false);

  useEffect(() => {
    let active = true;
    retryOnTimeout(() => getInvitationPreview(invitationToken, { withAuth: true })).then(
      (result) => active && setPreview(result),
      (error: unknown) => active && setErrorKind(toErrorKind(error)),
    );
    return () => {
      active = false;
    };
  }, [invitationToken]);

  const goHome = () => navigate('/', { replace: true });

  if (errorKind) {
    return <ErrorScreen kind={errorKind} capacity={preview?.trip.capacity} />;
  }

  if (!preview || isJoining) {
    return <LoadingScreen title="여행방에 입장 중이에요" description="잠시만 기다려주세요" />;
  }

  const { trip, inviter, members, alreadyJoined, conflictingTrip } = preview;

  if (alreadyJoined) {
    return <Navigate to={`/trips/${encodeURIComponent(trip.tripId)}`} replace />;
  }

  // 정원이 이미 찼으면 참여 화면 대신 정원 초과 화면을 보여줍니다. (설계서 3-c)
  if (trip.memberCount >= trip.capacity) {
    return <ErrorScreen kind="full" capacity={trip.capacity} />;
  }

  const join = async ({ leaveTripId }: { leaveTripId?: string } = {}) => {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setIsJoining(true);

    try {
      // 일정이 겹치는 기존 여행방에서 먼저 나갑니다. (설계서 11-a)
      if (leaveTripId) {
        try {
          await leaveTrip(leaveTripId);
        } catch (error) {
          setIsJoining(false);
          setNotice({
            title: '기존 여행방에서 나가지 못했어요',
            description:
              getApiErrorCode(error) === HOST_CANNOT_LEAVE_ALONE
                ? getApiErrorMessage(error)
                : '잠시 후 다시 시도해 주세요.',
          });
          return;
        }
      }

      const result = await retryOnTimeout(() => joinTrip(invitationToken));
      navigate(`/trips/${encodeURIComponent(result.tripId)}/survey`, { replace: true });
    } catch (error) {
      setIsJoining(false);
      const code = getApiErrorCode(error);
      if (code === TRIP_JOIN_ERROR_CODES.alreadyJoined) {
        navigate(`/trips/${encodeURIComponent(trip.tripId)}`, { replace: true });
      } else if (code === TRIP_JOIN_ERROR_CODES.dateConflict) {
        setNotice({
          title: '같은 날짜에 이미 여행이 있어요',
          description: getApiErrorMessage(error),
        });
      } else {
        setErrorKind(toErrorKind(error));
      }
    } finally {
      joiningRef.current = false;
    }
  };

  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenCount = members.length - visibleMembers.length;

  return (
    <main className={styles.container}>
      <p className={styles.brand}>PLAN IT</p>

      <section className={styles.card} aria-labelledby="invitation-title">
        <Avatar name={inviter.userName} imageUrl={inviter.profileImageUrl} size="lg" />
        <p className={styles.inviteText}>
          {withSubjectParticle(inviter.userName)} 여행에 초대했어요
        </p>
        <h1 id="invitation-title" className={styles.title} title={trip.name}>
          {truncateTripName(trip.name)}에
          <br />
          함께할까요?
        </h1>
        <div className={styles.tripInfo}>
          <p className={styles.region}>
            <MapPinIcon size={18} />
            {getDestinationName(trip.region.regionId, trip.region)}
          </p>
          <p className={styles.date}>{formatDotDate(trip.startDate)}</p>
        </div>
      </section>

      <section className={styles.members} aria-labelledby="members-title">
        <h2 id="members-title" className={styles.membersTitle}>
          현재 참여 멤버 · {trip.memberCount}/{trip.capacity}명
        </h2>
        <div className={styles.memberRow}>
          <AvatarGroup
            members={visibleMembers.map((member) => ({
              name: member.userName,
              imageUrl: member.profileImageUrl,
            }))}
          />
          {hiddenCount > 0 && (
            <span className={styles.more} aria-label={`외 ${hiddenCount}명`}>
              …
            </span>
          )}
        </div>
      </section>

      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden="true">
          !
        </span>
        <div>
          <p className={styles.noticeTitle}>참여하면 이름과 취향 결과가</p>
          <p className={styles.noticeText}>여행 멤버에게 공유돼요.</p>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={() => join()}
        >
          여행에 참여하기
        </Button>
        <button type="button" className={styles.backButton} onClick={goHome}>
          되돌아가기
        </button>
      </div>

      <ConfirmDialog
        open={conflictingTrip !== null && !isConflictDismissed}
        icon={<CalendarIcon size={18} />}
        title="같은 날짜에 이미 여행이 있어요"
        description={
          conflictingTrip
            ? `이 여행에 참여하면 기존 여행방 '${conflictingTrip.name}'에서 나가져요`
            : undefined
        }
        // 취소하면 새 여행에는 참여할 수 없어요. (설계서 11-b)
        cancelAction={{ label: '취소', onClick: goHome }}
        confirmAction={{
          label: '계속하기',
          onClick: () => {
            setIsConflictDismissed(true);
            void join({ leaveTripId: conflictingTrip?.tripId });
          },
        }}
        onClose={goHome}
      />

      <AlertDialog
        open={notice !== null}
        title={notice?.title ?? ''}
        description={notice?.description}
        primaryAction={{ label: '메인으로 가기', onClick: goHome }}
        onClose={() => setNotice(null)}
      />
    </main>
  );
}

function ErrorScreen({ kind, capacity }: { kind: ErrorKind; capacity?: number }) {
  const navigate = useNavigate();
  const { icon, title, description } = getErrorContent(kind, capacity);

  return (
    <main className={styles.errorContainer}>
      <StatusMessage icon={icon} title={title} description={description}>
        <Button size="lg" className="h-12 w-full" onClick={() => navigate('/', { replace: true })}>
          홈으로 가기
        </Button>
      </StatusMessage>
    </main>
  );
}
