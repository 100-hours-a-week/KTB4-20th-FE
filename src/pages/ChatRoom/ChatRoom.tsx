import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, SendHorizontal, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/AuthContext';
import { getAccessToken } from '../../auth/tokenStore';
import { generateUuidV7 } from '../../utils/uuidv7';
import {
  fetchChatMessages,
  fetchRegionalChatRooms,
  getApiErrorCode,
  leaveRegionalChatRoom,
  type ChatMessageItem,
  type RegionalChatRoomItem,
} from '../../api/chat';
import {
  connectChatSocket,
  disconnectChatSocket,
  sendTextMessage,
  setUserEventHandler,
  subscribeRoom,
  unsubscribeRoom,
  type ChatMessageCreatedEvent,
  type ChatUserEvent,
} from '../../realtime/chatSocket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import styles from './ChatRoom.module.css';

type RoomSummary = Pick<RegionalChatRoomItem, 'roomId' | 'name' | 'memberCount' | 'activeUserCount'>;
type DisplayMessage = ChatMessageItem & { status?: 'sending' | 'failed' };

const MESSAGE_LENGTH_LIMIT = 1000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return '오늘';
  if (sameDay(date, yesterday)) return '어제';
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

interface MessageGroupItem {
  message: DisplayMessage;
  isMine: boolean;
  groupChanged: boolean;
  dateLabel: string;
  showDateDivider: boolean;
}

/** 연속된 같은 발신자 메시지를 하나의 그룹으로, 날짜가 바뀌는 지점을 표시하기 위해 미리 계산한다. */
function messageGroups(messages: DisplayMessage[], currentUserPublicId?: string): MessageGroupItem[] {
  let lastSenderId: string | undefined;
  let lastDateLabel: string | null = null;

  return messages.map((message) => {
    const isMine = message.sender.publicId === currentUserPublicId;
    const groupChanged = message.sender.publicId !== lastSenderId;
    lastSenderId = message.sender.publicId;

    const dateLabel = formatDateDivider(message.createdAt);
    const showDateDivider = dateLabel !== lastDateLabel;
    lastDateLabel = dateLabel;

    return { message, isMine, groupChanged, dateLabel, showDateDivider };
  });
}

export default function ChatRoom() {
  const { roomId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<RoomSummary | null>(
    (location.state as { room?: RoomSummary } | null)?.room ?? null,
  );
  const [roomLoadError, setRoomLoadError] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [historyState, setHistoryState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting',
  );
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // 방 요약 정보가 없으면(직접 진입·새로고침) 목록에서 다시 찾는다 — 방 단건 조회 API는 아직 없다.
  useEffect(() => {
    if (room) return;
    let cancelled = false;
    fetchRegionalChatRooms()
      .then((data) => {
        if (cancelled) return;
        const found = data.items.find((item) => item.roomId === roomId);
        if (found) {
          setRoom(found);
        } else {
          setRoomLoadError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setRoomLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [room, roomId]);

  // 메시지 이력 최초 조회
  useEffect(() => {
    let cancelled = false;
    setHistoryState('loading');
    fetchChatMessages(roomId)
      .then((data) => {
        if (cancelled) return;
        setMessages(data.items);
        setOlderCursor(data.page.nextCursor);
        setHasOlder(data.page.hasNext);
        setHistoryState('ready');
      })
      .catch(() => {
        if (!cancelled) setHistoryState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const handleMessageCreated = useCallback((event: ChatMessageCreatedEvent) => {
    setMessages((prev) => {
      const withoutOptimistic = prev.filter(
        (message) => message.clientMessageId !== event.data.clientMessageId,
      );
      if (withoutOptimistic.some((message) => message.messageId === event.data.messageId)) {
        return withoutOptimistic;
      }
      return [...withoutOptimistic, event.data];
    });
  }, []);

  const handleUserEvent = useCallback(
    (event: ChatUserEvent) => {
      if (event.eventType === 'CHAT_MESSAGE_RESULT') {
        if (event.status === 'ACCEPTED') {
          setMessages((prev) =>
            prev.map((message) =>
              message.clientMessageId === event.clientMessageId
                ? { ...message, status: undefined }
                : message,
            ),
          );
          return;
        }
        setMessages((prev) =>
          prev.map((message) =>
            message.clientMessageId === event.clientMessageId
              ? { ...message, status: 'failed' }
              : message,
          ),
        );
        toast.error(event.message);
        return;
      }
      if (event.eventType === 'CHAT_ROOM_MEMBERSHIP_ENDED') {
        toast.info(event.message);
        navigate('/open-chat');
        return;
      }
      if (
        event.eventType === 'CHAT_POLICY_CONSENT_REQUIRED' ||
        event.eventType === 'CHAT_SANCTION_UPDATED'
      ) {
        toast.info(event.message);
      }
    },
    [navigate],
  );

  // WebSocket 연결과 방 구독 — 채팅방 화면 진입 시 연결, 벗어나면 종료한다.
  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setConnectionStatus('error');
      return;
    }

    let cancelled = false;
    setConnectionStatus('connecting');
    setUserEventHandler(handleUserEvent);

    connectChatSocket(accessToken)
      .then(() => subscribeRoom(roomId, handleMessageCreated))
      .then(() => {
        if (!cancelled) setConnectionStatus('connected');
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setConnectionStatus('error');
          toast.error(error.message);
        }
      });

    return () => {
      cancelled = true;
      unsubscribeRoom();
      void disconnectChatSocket();
    };
  }, [roomId, handleMessageCreated, handleUserEvent]);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlderMessages() {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const data = await fetchChatMessages(roomId, { cursor: olderCursor });
      setMessages((prev) => [...data.items, ...prev]);
      setOlderCursor(data.page.nextCursor);
      setHasOlder(data.page.hasNext);
    } catch {
      toast.error('이전 메시지를 불러오지 못했어요.');
    } finally {
      setLoadingOlder(false);
    }
  }

  function handleSend() {
    const text = composerText.trim();
    if (!text || text.length > MESSAGE_LENGTH_LIMIT || sending) return;
    if (connectionStatus !== 'connected') {
      toast.error('채팅 서버에 연결되어 있지 않아요.');
      return;
    }

    const clientMessageId = generateUuidV7();
    const optimisticMessage: DisplayMessage = {
      messageId: `optimistic-${clientMessageId}`,
      clientMessageId,
      messageType: 'TEXT',
      text,
      image: null,
      sender: {
        publicId: user?.publicId,
        userName: user?.userName ?? '나',
        profileImageUrl: user?.profileImageUrl,
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setSending(true);
    shouldAutoScroll.current = true;
    setMessages((prev) => [...prev, optimisticMessage]);
    setComposerText('');
    try {
      sendTextMessage(roomId, clientMessageId, text);
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.clientMessageId === clientMessageId ? { ...message, status: 'failed' } : message,
        ),
      );
      toast.error('메시지를 보내지 못했어요.');
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    // 한글 등 조합형 입력 중 Enter로 조합을 확정할 때 키다운이 한 번 더 발생해
    // isComposing 체크 없이 처리하면 마지막 글자가 중복 전송된다.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;

    event.preventDefault();
    handleSend();
  }

  function handleImageButtonClick() {
    toast.info('이미지 전송은 아직 준비 중이에요.');
  }

  async function handleLeave() {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveRegionalChatRoom(roomId);
      navigate('/open-chat');
    } catch (error) {
      const code = getApiErrorCode(error);
      toast.error(
        code === 'REGIONAL_CHAT_MEMBER_REQUIRED'
          ? '이미 채팅방을 나갔어요.'
          : '채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      setLeaving(false);
    }
  }

  if (roomLoadError) {
    return (
      <div className={styles.centerStatus}>
        <p>채팅방 정보를 찾을 수 없어요.</p>
        <Button onClick={() => navigate('/open-chat')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  const renderItems = messageGroups(messages, user?.publicId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/open-chat')}
          aria-label="목록으로 돌아가기"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className={styles.headerInfo}>
          <h1 className={styles.roomName}>{room ? `${room.name} 여행자방` : '채팅방'}</h1>
          {room && (
            <p className={styles.roomMeta}>
              {room.memberCount}명 · 지금 {room.activeUserCount}명 접속
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleLeave} disabled={leaving}>
          나가기
        </Button>
      </header>

      {connectionStatus === 'error' && (
        <Alert variant="destructive" className="mx-4 mt-3 w-auto rounded-lg">
          <TriangleAlert />
          <AlertDescription className="flex items-center justify-between gap-3">
            연결이 끊어졌어요.
            <Button type="button" variant="outline" size="xs" onClick={() => navigate(0)}>
              다시 연결
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className={styles.messageList} onScroll={handleScroll}>
        {historyState === 'loading' && <p className={styles.status}>메시지를 불러오는 중이에요.</p>}
        {historyState === 'error' && <p className={styles.status}>메시지를 불러오지 못했어요.</p>}

        {historyState === 'ready' && (
          <>
            {hasOlder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-4 w-full"
                onClick={loadOlderMessages}
                disabled={loadingOlder}
              >
                {loadingOlder ? '불러오는 중...' : '이전 메시지 더 보기'}
              </Button>
            )}

            {renderItems.map(({ message, isMine, groupChanged, dateLabel, showDateDivider }) => {
              return (
                <div key={message.messageId}>
                  {showDateDivider && <div className={styles.dateDivider}>{dateLabel}</div>}
                  <div
                    className={
                      isMine ? `${styles.messageRow} ${styles.mine}` : styles.messageRow
                    }
                  >
                    {!isMine && (
                      <div className={styles.avatarSlot}>
                        {groupChanged && (
                          <img
                            className={styles.avatar}
                            src={message.sender.profileImageUrl}
                            alt=""
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    )}
                    <div className={styles.bubbleColumn}>
                      {!isMine && groupChanged && (
                        <span className={styles.senderName}>{message.sender.userName}</span>
                      )}
                      <div className={styles.bubbleRow}>
                        {isMine && (
                          <span className={styles.timeLabel}>
                            {message.status === 'sending'
                              ? '전송 중'
                              : message.status === 'failed'
                                ? '전송 실패'
                                : formatTime(message.createdAt)}
                          </span>
                        )}
                        <div
                          className={
                            message.status === 'failed'
                              ? `${styles.bubble} ${styles.bubbleFailed}`
                              : styles.bubble
                          }
                        >
                          {message.text}
                        </div>
                        {!isMine && <span className={styles.timeLabel}>{formatTime(message.createdAt)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.composer}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={handleImageButtonClick}
          aria-label="이미지 첨부"
        >
          <Plus className="size-5" />
        </Button>
        <Textarea
          className="max-h-24 min-h-10 flex-1 resize-none rounded-3xl py-2"
          placeholder="메시지를 입력하세요"
          value={composerText}
          onChange={(event) => setComposerText(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          rows={1}
          maxLength={MESSAGE_LENGTH_LIMIT}
        />
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          onClick={handleSend}
          disabled={!composerText.trim() || sending}
          aria-label="메시지 전송"
        >
          <SendHorizontal className="size-5" />
        </Button>
      </div>
    </div>
  );
}
