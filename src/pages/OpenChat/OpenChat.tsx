import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import BottomNav from '../../components/BottomNav/BottomNav';
import RegionIllustration from '../../components/RegionIllustration/RegionIllustration';
import { fetchRegionalChatRooms, type RegionalChatRoomItem } from '../../api/chat';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import JoinRoomModal from './JoinRoomModal';
import styles from './OpenChat.module.css';

/** 채팅방 이름("서울 여행 이야기")의 첫 단어를 지역 이름으로 보고 풍경 그림을 고른다. */
function RoomThumb({ room }: { room: RegionalChatRoomItem }) {
  return (
    <span className={styles.thumb} aria-hidden="true">
      <RegionIllustration regionCode={room.regionId} regionName={room.name.split(' ')[0]} />
    </span>
  );
}

function RoomRow({
  room,
  onClick,
}: {
  room: RegionalChatRoomItem;
  onClick: (room: RegionalChatRoomItem) => void;
}) {
  return (
    <li>
      <button type="button" className={styles.roomButton} onClick={() => onClick(room)}>
        <RoomThumb room={room} />
        <span className={styles.roomInfo}>
          <span className={styles.roomNameRow}>
            <span className={styles.roomName}>{room.name}</span>
            {room.joined && <span className={styles.joined}>참여 중</span>}
          </span>
          <span className={styles.roomMeta}>
            <span className={styles.onlineDot} aria-hidden="true" />
            {room.activeUserCount}명 대화 중 · {room.memberCount}명 참여
          </span>
        </span>
        <MessageCircle className={styles.enterIcon} size={18} aria-hidden="true" />
      </button>
    </li>
  );
}

export default function OpenChat() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RegionalChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RegionalChatRoomItem | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchRegionalChatRooms();
      setRooms(data.items);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const myRooms = rooms.filter((room) => room.relatedToMyTrip);
  const otherRooms = rooms.filter((room) => !room.relatedToMyTrip);

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
          <p className={styles.subtitle}>같은 곳으로 떠나는 사람들과 여행 정보를 나눠요</p>
        </header>

        {loading && (
          <ul className={styles.list} aria-busy="true" aria-label="채팅방 목록을 불러오는 중">
            {[0, 1, 2].map((key) => (
              <li key={key} className={styles.roomButton}>
                <Skeleton className="size-12 shrink-0 rounded-[12px] bg-accent" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-28 bg-accent" />
                  <Skeleton className="h-3 w-40 bg-accent" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && loadError && (
          <div className={styles.status}>
            <p>채팅방 목록을 불러오지 못했어요.</p>
            <Button onClick={loadRooms}>다시 시도</Button>
          </div>
        )}

        {!loading && !loadError && rooms.length === 0 && (
          <p className={styles.status}>참여할 수 있는 지역 채팅방이 없어요.</p>
        )}

        {!loading && !loadError && myRooms.length > 0 && (
          <section className={styles.section} aria-labelledby="my-region-rooms">
            <h2 id="my-region-rooms" className={styles.sectionTitle}>
              내 여행 지역
            </h2>
            <ul className={styles.list}>
              {myRooms.map((room) => (
                <RoomRow key={room.roomId} room={room} onClick={handleRoomClick} />
              ))}
            </ul>
          </section>
        )}

        {!loading && !loadError && otherRooms.length > 0 && (
          <section className={styles.section} aria-labelledby="all-region-rooms">
            <h2 id="all-region-rooms" className={styles.sectionTitle}>
              {myRooms.length > 0 ? '다른 지역' : '모든 지역'}
            </h2>
            <ul className={styles.list}>
              {otherRooms.map((room) => (
                <RoomRow key={room.roomId} room={room} onClick={handleRoomClick} />
              ))}
            </ul>
          </section>
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
