import { useEffect, useRef, useState } from 'react';
import { CameraOffIcon, ImageIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import styles from './CameraCapture.module.css';

interface CameraCaptureProps {
  onCapture: (photo: File) => void;
  onClose: () => void;
  /** 카메라를 못 쓸 때 파일에서 고르게 해요. (버튼을 누른 순간에 열어야 해서 콜백으로 받아요) */
  onPickFile: () => void;
}

type CameraState = 'starting' | 'live' | 'captured' | 'denied' | 'unavailable';

/**
 * 화면 안 카메라. 휴대폰은 기본 카메라 앱을 열지만, PC처럼 바로 촬영을 지원하지 않는 브라우저에서는
 * 이 화면으로 웹캠을 켜서 찍어요. 다른 화면과 같은 바탕·머리글(뒤로 가기)을 쓰고 촬영 칸만 어둡게 둬요.
 */
export default function CameraCapture({ onCapture, onClose, onPickFile }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CameraState>(() =>
    typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'starting' : 'unavailable',
  );
  const [captured, setCaptured] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    overlayRef.current?.focus();
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setState('live');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const denied = error instanceof DOMException && error.name === 'NotAllowedError';
        setState(denied ? 'denied' : 'unavailable');
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!captured) return;
    return () => URL.revokeObjectURL(captured.url);
  }, [captured]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
        setCaptured({ file, url: URL.createObjectURL(blob) });
        setState('captured');
      },
      'image/jpeg',
      0.9,
    );
  };

  const retake = () => {
    setCaptured(null);
    setState('live');
  };

  const message =
    state === 'denied'
      ? '카메라 권한이 꺼져 있어요. 브라우저 설정에서 허용하거나 파일에서 골라 주세요'
      : state === 'unavailable'
        ? '이 기기에서는 카메라를 켤 수 없어요. 파일에서 골라 주세요'
        : null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="사진 촬영"
      tabIndex={-1}
    >
      <PageHeader title="사진 촬영" onBack={onClose} />

      {message ? (
        <div className={styles.statusBody}>
          <StatusMessage
            icon={<CameraOffIcon size={20} strokeWidth={1.6} />}
            title={state === 'denied' ? '카메라를 쓸 수 없어요' : '카메라를 찾지 못했어요'}
            description={message}
          >
            <Button size="lg" className="h-13 w-full text-base font-semibold" onClick={onPickFile}>
              <ImageIcon className="size-4" aria-hidden="true" />
              파일에서 고르기
            </Button>
          </StatusMessage>
        </div>
      ) : (
        <>
          <div className={styles.viewfinder}>
            <video
              ref={videoRef}
              className={styles.media}
              autoPlay
              playsInline
              muted
              hidden={state === 'captured'}
            />
            {captured && state === 'captured' && (
              <img src={captured.url} alt="방금 찍은 사진" className={styles.media} />
            )}
            {state === 'starting' && <p className={styles.message}>카메라를 켜고 있어요</p>}
          </div>

          <div className={styles.controls}>
            {state === 'captured' && captured ? (
              <div className={styles.confirmRow}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 flex-1 text-base font-semibold"
                  onClick={retake}
                >
                  <RotateCcwIcon className="size-4" aria-hidden="true" />
                  다시 찍기
                </Button>
                <Button
                  size="lg"
                  className="h-13 flex-1 text-base font-semibold"
                  onClick={() => onCapture(captured.file)}
                >
                  이 사진 올리기
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.shutter}
                onClick={shoot}
                disabled={state !== 'live'}
                aria-label="촬영"
              >
                <span />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
