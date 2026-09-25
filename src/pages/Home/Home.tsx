import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import { HOST_CANNOT_LEAVE_ALONE, leaveTrip, type TripSummary } from '../../api/trips';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Avatar from '../../components/Avatar/Avatar';
import BottomSheet from '../../components/BottomSheet/BottomSheet';
import BottomNav from '../../components/BottomNav/BottomNav';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { PencilIcon, PlusIcon, UsersIcon } from 'lucide-react';
import TripCard, { TripCardSkeleton } from '../../components/TripCard/TripCard';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '@/components/ui/button';
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
      await leaveTrip(leavingTrip.tripId);
      tripList.removeTrip(leavingTrip.tripId);
      setLeavingTrip(null);
    } catch (error) {
      setLeavingTrip(null);
      setNotice(
        getApiErrorCode(error) === HOST_CANNOT_LEAVE_ALONE
          ? { title: '아직 여행방을 나갈 수 없어요', description: getApiErrorMessage(error) }
          : { title: '여행방을 나가지 못했어요', description: '잠시 후 다시 시도해 주세요.' },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.greeting}>
            <p className={styles.hello}>안녕하세요</p>
            <h1 className={styles.userName}>{user ? `${user.userName}님` : '여행자님'}</h1>
          </div>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setIsProfileOpen(true)}
            aria-label="프로필 관리 열기"
            aria-haspopup="dialog"
          >
            <Avatar name={user?.userName ?? ''} imageUrl={user?.profileImageUrl} />
          </button>
        </header>

        <Button
          size="lg"
          className="mb-6 h-11 w-full rounded-[var(--radius-sm)] font-semibold"
          onClick={() => navigate('/trips/new')}
        >
          <PlusIcon size={18} />
          여행 시작하기
        </Button>

        <TripListSection {...tripList} onLeave={setLeavingTrip} />
      </main>

      <BottomNav />

      <BottomSheet open={isProfileOpen} label="프로필 관리" onClose={() => setIsProfileOpen(false)}>
        <p className={styles.sheetSection}>정보</p>
        <ul className={styles.sheetMenu}>
          <li>
            <button type="button" className={styles.sheetItem} onClick={handleLogout}>
              <PencilIcon size={18} />
              로그아웃
            </button>
          </li>
          <li>
            <button type="button" className={styles.sheetItem} onClick={openWithdrawDialog}>
              <UsersIcon size={18} />
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
        title="여행방을 나갈까요?"
        description={leavingTrip ? `'${leavingTrip.name}' 여행방이 목록에서 사라져요.` : undefined}
        cancelAction={{ label: '취소', onClick: () => setLeavingTrip(null) }}
        confirmAction={{ label: '나가기', onClick: handleLeaveTrip, disabled: isSubmitting }}
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
        <div className={styles.list}>
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.statusArea}>
        <StatusMessage
          icon="!"
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
          icon="+"
          title="아직 참여 중인 여행방이 없어요"
          description={'위 버튼으로 방을 만들거나,\n친구가 보낸 초대 링크로 들어와 보세요'}
        />
      </div>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="trip-list-title">
      <h2 id="trip-list-title" className={styles.sectionTitle}>
        참여 중인 여행방
      </h2>
      <ul className={styles.list}>
        {trips.map((trip) => (
          <li key={trip.tripId}>
            <TripCard trip={trip} onLeave={onLeave} />
          </li>
        ))}
      </ul>
      {isLoadingMore && (
        <div className={styles.list} aria-hidden="true">
          <TripCardSkeleton />
        </div>
      )}
      {loadMoreFailed && (
        <button type="button" className={styles.retryButton} onClick={() => void loadMore()}>
          목록을 더 불러오지 못했어요. 다시 시도
        </button>
      )}
      <div ref={sentinelRef} className={styles.sentinel} />
    </section>
  );
}
