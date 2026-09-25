import { useCallback, useEffect, useState } from 'react';
import BottomNav from '../../components/BottomNav/BottomNav';
import Toast from '../../components/Toast/Toast';
import { fetchRegionalChatRooms, type RegionalChatRoomItem } from '../../api/chat';
import JoinRoomModal from './JoinRoomModal';
import styles from './OpenChat.module.css';

export default function OpenChat() {
  const [rooms, setRooms] = useState<RegionalChatRoomItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
      setToastMessage('목록을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleRoomJoined(roomId: string) {
    setRooms((prev) =>
      prev.map((item) => (item.roomId === roomId ? { ...item, joined: true } : item)),
    );
    setActiveRoom(null);
    // TODO: 채팅방 상세 화면이 구현되면 입장 성공 시 해당 화면으로 이동한다.
  }

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <h1 className={styles.title}>오픈 채팅</h1>

        {loading && <p className={styles.status}>채팅방 목록을 불러오는 중이에요.</p>}

        {!loading && loadError && (
          <div className={styles.status}>
            <p>채팅방 목록을 불러오지 못했어요.</p>
            <button type="button" className={styles.retryButton} onClick={loadFirstPage}>
              다시 시도
            </button>
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
                  onClick={() => setActiveRoom(room)}
                >
                  <span className={styles.roomInfo}>
                    <span className={styles.roomName}>{room.name}</span>
                    <span className={styles.roomMeta}>{room.memberCount}명</span>
                  </span>
                  {room.joined && <span className={styles.joinedBadge}>참여 중인 채팅방</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && !loadError && hasNext && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        )}
      </main>

      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

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
