import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BottomNav from '../../components/BottomNav/BottomNav';
import { fetchRegionalChatRooms, type RegionalChatRoomItem } from '../../api/chat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import JoinRoomModal from './JoinRoomModal';
import styles from './OpenChat.module.css';

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21.5s7-6.55 7-11.8A7 7 0 0 0 5 9.7c0 5.25 7 11.8 7 11.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.7" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function OpenChat() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RegionalChatRoomItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RegionalChatRoomItem | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchRegionalChatRooms();
      setRooms(data.items);
      setNextCursor(data.page.nextCursor);
      setHasNext(data.page.hasNext);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const data = await fetchRegionalChatRooms(nextCursor);
      setRooms((prev) => [...prev, ...data.items]);
      setNextCursor(data.page.nextCursor);
      setHasNext(data.page.hasNext);
    } catch {
      toast.error('목록을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleRoomJoined(room: RegionalChatRoomItem) {
    setActiveRoom(null);
    navigate(`/open-chat/rooms/${room.roomId}`, { state: { room: { ...room, joined: true } } });
  }

  function handleRoomClick(room: RegionalChatRoomItem) {
    if (room.joined) {
      navigate(`/open-chat/rooms/${room.roomId}`, { state: { room } });
      return;
    }
    setActiveRoom(room);
  }

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>오픈 채팅</h1>
          <p className={styles.subtitle}>지역별 공개 채팅에서 여행 정보를 나눠보세요.</p>
        </header>

        {loading && (
          <ul className={styles.list} aria-label="채팅방 목록을 불러오는 중">
            {[0, 1, 2].map((key) => (
              <li key={key} className={styles.roomButton}>
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && loadError && (
          <div className={styles.status}>
            <p>채팅방 목록을 불러오지 못했어요.</p>
            <Button onClick={loadFirstPage}>다시 시도</Button>
          </div>
        )}

        {!loading && !loadError && rooms.length === 0 && (
          <p className={styles.status}>참여할 수 있는 지역 채팅방이 없어요.</p>
        )}

        {!loading && !loadError && rooms.length > 0 && (
          <ul className={styles.list}>
            {rooms.map((room) => (
              <li key={room.roomId}>
                <button
                  type="button"
                  className={styles.roomButton}
                  onClick={() => handleRoomClick(room)}
                >
                  <span className={styles.roomIcon}>
                    <LocationIcon />
                  </span>
                  <span className={styles.roomInfo}>
                    <span className={styles.roomNameRow}>
                      <span className={styles.roomName}>{room.name}</span>
                      {room.relatedToMyTrip && (
                        <Badge
                          variant="outline"
                          className="border-[var(--color-brand-secondary)] text-[var(--color-brand-secondary)]"
                        >
                          내 여행 지역
                        </Badge>
                      )}
                    </span>
                    <span className={styles.roomMeta}>
                      {room.memberCount}명 참여 · {room.activeUserCount}명 접속 중
                    </span>
                  </span>
                  {room.joined && (
                    <Badge className="shrink-0 bg-[var(--color-brand-accent)] text-[var(--color-brand-accent-text)]">
                      참여 중인 채팅방
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && !loadError && hasNext && (
          <Button
            variant="outline"
            className="mt-5 w-full"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </Button>
        )}
      </main>

      {activeRoom && (
        <JoinRoomModal
          room={activeRoom}
          onClose={() => setActiveRoom(null)}
          onJoined={handleRoomJoined}
        />
      )}

      <BottomNav />
    </div>
  );
}
