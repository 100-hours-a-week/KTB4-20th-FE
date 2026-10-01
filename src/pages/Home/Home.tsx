import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import { leaveTrip, TRIP_LEAVE_NOT_ALLOWED, type TripSummary } from '../../api/trips';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Avatar from '../../components/Avatar/Avatar';
import BottomSheet from '../../components/BottomSheet/BottomSheet';
import BottomNav from '../../components/BottomNav/BottomNav';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import {
  ArrowUpRightIcon,
  CircleAlertIcon,
  LogOutIcon,
  PlaneIcon,
  PlusIcon,
  UserXIcon,
} from 'lucide-react';
import FeaturedTripCard, {
  FeaturedTripCardSkeleton,
} from '../../components/TripCard/FeaturedTripCard';
import TripRow, { TripRowSkeleton } from '../../components/TripCard/TripRow';
import planitSymbol from '../../assets/logo/planit-symbol.svg';
import { useAuth } from '../../auth/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import useTripList from '../../hooks/useTripList';
import styles from './Home.module.css';

interface Notice {
  title: string;
  description?: string;
}

export default function Home() {
  const navigate = useNavigate();
  // 사용자 정보는 로그인 확인 때 AuthProvider가 함께 불러옵니다.
  const { user, logout, withdraw } = useAuth();
  const tripList = useTripList();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [leavingTrip, setLeavingTrip] = useState<TripSummary | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
    } catch {
      // 서버 요청이 실패해도 화면의 로그인 상태는 해제되어 로그인 화면으로 이동합니다.
    }
    navigate('/login', { replace: true });
  };

  const openWithdrawDialog = () => {
    setIsProfileOpen(false);
    setIsWithdrawOpen(true);
  };

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      await withdraw();
      navigate('/login', { replace: true });
    } catch {
      setIsWithdrawOpen(false);
      setNotice({
        title: '회원 탈퇴를 완료하지 못했어요',
        description: '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!leavingTrip) return;
    setIsSubmitting(true);
    try {
      const response = await leaveTrip(leavingTrip.tripId);
      tripList.removeTrip(leavingTrip.tripId);
      setLeavingTrip(null);
      toast.success(response.tripDeleted ? '여행방을 삭제했어요.' : '여행방을 나갔어요.');
    } catch (error) {
      setLeavingTrip(null);
      if (getApiErrorCode(error) === TRIP_LEAVE_NOT_ALLOWED) {
        setNotice({
          title: '여행방을 나갈 수 없어요',
          description: '이미 시작됐거나 끝난 여행은 나갈 수 없어요.',
        });
        return;
      }
      setNotice({ title: '여행방을 나가지 못했어요', description: '잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName = user ? `${user.userName}님` : '여행자님';

  return (
    <>
      <main className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.topBar}>
            <span className={styles.brand}>
              <img src={planitSymbol} alt="" width={24} height={24} />
              PlanIt
            </span>
            <button
              type="button"
              className={styles.profileButton}
              onClick={() => setIsProfileOpen(true)}
              aria-label="프로필 관리 열기"
              aria-haspopup="dialog"
            >
              <Avatar name={user?.userName ?? ''} imageUrl={user?.profileImageUrl} />
            </button>
          </div>

          <h1 className={styles.headline}>
            {userName},
            <br />
            어디로 떠나볼까요?
          </h1>

          <button
            type="button"
            className={styles.createButton}
            onClick={() => navigate('/trips/new')}
          >
            <span className={styles.createIcon} aria-hidden="true">
              <PlusIcon size={16} strokeWidth={2.75} />
            </span>
            <span className={styles.createText}>새 여행 만들기</span>
            <ArrowUpRightIcon size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.content}>
          <TripListSection {...tripList} onLeave={setLeavingTrip} />
        </div>
      </main>

      <BottomNav />

      <BottomSheet open={isProfileOpen} label="프로필 관리" onClose={() => setIsProfileOpen(false)}>
        <div className={styles.sheetProfile}>
          <Avatar name={user?.userName ?? ''} imageUrl={user?.profileImageUrl} size="lg" />
          <p className={styles.sheetName}>{user?.userName ?? '여행자'}</p>
        </div>
        <ul className={styles.sheetMenu}>
          <li>
            <button type="button" className={styles.sheetItem} onClick={handleLogout}>
              <LogOutIcon size={18} />
              로그아웃
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.sheetItem} ${styles.sheetItemDanger}`}
              onClick={openWithdrawDialog}
            >
              <UserXIcon size={18} />
              회원탈퇴
            </button>
          </li>
        </ul>
      </BottomSheet>

      <AlertDialog
        open={isWithdrawOpen}
        title="정말 회원 탈퇴 하시겠어요?"
        description="탈퇴 시 관련 내용이 모두 삭제되고 복구할 수 없습니다."
        primaryAction={{ label: '회원 탈퇴', onClick: handleWithdraw, disabled: isSubmitting }}
        secondaryAction={{ label: '취소', onClick: () => setIsWithdrawOpen(false) }}
        onClose={() => setIsWithdrawOpen(false)}
      />

      <ConfirmDialog
        open={leavingTrip !== null}
        title={
          leavingTrip && leavingTrip.memberCount <= 2
            ? '여행방을 삭제할까요?'
            : '여행방을 나갈까요?'
        }
        description={
          leavingTrip
            ? leavingTrip.memberCount <= 2
              ? `나가면 남은 인원이 1명이 되어, '${leavingTrip.name}' 여행방이 삭제되고 복구할 수 없어요.`
              : `'${leavingTrip.name}' 여행방이 목록에서 사라져요.`
            : undefined
        }
        cancelAction={{ label: '취소', onClick: () => setLeavingTrip(null) }}
        confirmAction={{
          label: leavingTrip && leavingTrip.memberCount <= 2 ? '삭제하기' : '나가기',
          onClick: handleLeaveTrip,
          disabled: isSubmitting,
        }}
        onClose={() => setLeavingTrip(null)}
      />

      <AlertDialog
        open={notice !== null}
        title={notice?.title ?? ''}
        description={notice?.description}
        primaryAction={{ label: '확인', onClick: () => setNotice(null) }}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

interface TripListSectionProps extends ReturnType<typeof useTripList> {
  onLeave: (trip: TripSummary) => void;
}

function TripListSection({
  trips,
  status,
  hasNext,
  isLoadingMore,
  loadMoreFailed,
  loadMore,
  onLeave,
}: TripListSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canLoadMore = status === 'success' && hasNext && !loadMoreFailed;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, trips.length]);

  if (status === 'loading') {
    return (
      <section className={styles.section} aria-busy="true" aria-label="여행방 목록을 불러오는 중">
        <Skeleton className="h-[18px] w-[88px] bg-accent" />
        <FeaturedTripCardSkeleton />
        <div className={styles.rows}>
          <TripRowSkeleton />
          <TripRowSkeleton />
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.statusArea}>
        <StatusMessage
          icon={<CircleAlertIcon size={26} strokeWidth={1.8} />}
          title="여행방 목록을 가져오지 못했어요"
          description="새로고침 해주세요"
        />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className={styles.statusArea}>
        <StatusMessage
          icon={<PlaneIcon size={26} strokeWidth={1.8} />}
          title="아직 참여 중인 여행방이 없어요"
          description={'위 버튼으로 방을 만들거나,\n친구가 보낸 초대 링크로 들어와 보세요'}
        />
      </div>
    );
  }

  // 백엔드가 다가오는 여행을 출발일 순으로 먼저 보내지만, 불러온 범위 안에서 한 번 더 출발일 순으로 맞춘다.
  // (YYYY-MM-DD 문자열이라 문자열 비교가 곧 날짜 비교)
  const notCompleted = trips
    .filter((trip) => trip.status !== 'TRIP_COMPLETED')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const [featured, ...upcoming] = notCompleted;
  const completed = trips.filter((trip) => trip.status === 'TRIP_COMPLETED');

  return (
    <div className={styles.sections}>
      {featured && (
        <section className={styles.section} aria-labelledby="featured-trip-title">
          <h2 id="featured-trip-title" className={styles.sectionTitle}>
            다가오는 여행
          </h2>
          <FeaturedTripCard trip={featured} onLeave={onLeave} />
          {upcoming.length > 0 && (
            <ul className={styles.rows} aria-label="이어지는 여행">
              {upcoming.map((trip) => (
                <li key={trip.tripId}>
                  <TripRow trip={trip} onLeave={onLeave} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {completed.length > 0 && (
        <TripRowSection
          id="completed-trips-title"
          title="완료한 여행"
          trips={completed}
          onLeave={onLeave}
        />
      )}

      {isLoadingMore && (
        <div className={styles.rows} aria-busy="true" aria-label="여행방을 더 불러오는 중">
          <TripRowSkeleton />
        </div>
      )}
      {loadMoreFailed && (
        <button type="button" className={styles.retryButton} onClick={() => void loadMore()}>
          목록을 더 불러오지 못했어요. 다시 시도
        </button>
      )}
      <div ref={sentinelRef} className={styles.sentinel} />
    </div>
  );
}

/** 한 줄 여행 목록 묶음 (완료한 여행) */
function TripRowSection({
  id,
  title,
  trips,
  onLeave,
}: {
  id: string;
  title: string;
  trips: TripSummary[];
  onLeave: (trip: TripSummary) => void;
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className={styles.rows}>
        {trips.map((trip) => (
          <li key={trip.tripId}>
            <TripRow trip={trip} onLeave={onLeave} />
          </li>
        ))}
      </ul>
    </section>
  );
}
