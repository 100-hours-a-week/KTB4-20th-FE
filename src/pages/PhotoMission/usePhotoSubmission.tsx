import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import {
  addGroupMissionPhoto,
  completeMissionManuallyWithPhoto,
  getPhotoMissionDetail,
  PHOTO_MISSION_ERROR_CODES,
  submitMissionPhoto,
  type PhotoCoordinates,
  type PhotoMissionDetail,
  type PhotoVerifyResponse,
} from '../../api/photoMissions';
import { readExifGps } from '../../utils/exifGps';
import { prepareUploadImage, UnsupportedImageError } from '../../utils/prepareUploadImage';
import { generateUuidV7 } from '../../utils/uuidv7';
import CameraCapture from './CameraCapture';

/** 판정 화면으로 넘기는 값. 새로고침하면 사라져서 판정 화면은 없으면 미션 상세로 돌아가요. */
export interface VerdictState {
  verdict: PhotoVerifyResponse;
  /** 방금 올린 사진 미리보기. 다음 사진을 올릴 때 해제해요. */
  previewUrl: string;
  /** 판정 뒤 다시 불러온 미션. 못 불러왔으면 null */
  mission: PhotoMissionDetail | null;
  /** 이미 완료한 개인 미션을 다시 찍었는지. 실패해도 기존 사진은 남아요. */
  retake: boolean;
}

/** 판정이 늦거나 결과를 못 받았을 때 보여줄 안내 */
export interface SubmissionNotice {
  title: string;
  description: string;
}

type Source = 'camera' | 'library';

/**
 * 파일 입력의 capture(바로 촬영)는 휴대폰 브라우저만 지원해요. PC에서는 파일 선택 창이 열려서,
 * 터치가 주 입력인 기기만 기본 카메라를 쓰고 나머지는 화면 안 카메라를 켜요.
 */
function supportsNativeCapture(): boolean {
  return window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
}

/**
 * 판정 화면에 넘긴 미리보기 주소. 화면이 닫힐 때 해제하면 개발 모드(StrictMode)의 두 번 실행이나
 * 뒤로 가기에서 사진이 깨져서, 다음 사진을 올릴 때 이전 것을 해제해요. (한 장만 남아요)
 */
let currentPreviewUrl: string | null = null;

function createPreviewUrl(photo: Blob): string {
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(photo);
  return currentPreviewUrl;
}

/** 판정 화면으로 넘기지 못했으면 바로 해제해요. */
function discardPreviewUrl(url: string) {
  URL.revokeObjectURL(url);
  if (currentPreviewUrl === url) currentPreviewUrl = null;
}

/** 현재 위치. 권한이 없거나 5초 안에 못 받으면 null이에요. */
function getCurrentPosition(): Promise<PhotoCoordinates | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 },
    );
  });
}

/**
 * 미션 사진 올리기.
 * - 촬영: 지금 찍은 사진이라 현재 위치를 보내요. (사파리는 촬영 사진의 위치를 항상 지워요)
 * - 앨범: 지난 사진일 수 있어 사진 속 위치(EXIF)만 보내요.
 * - 완료한 그룹 미션은 판정 없이 사진을 더해요.
 * - 판정에 3번 실패한 미션은 판정 없이 그 사진으로 바로 직접 완료해요. 직접 완료한 개인 미션을 다시 찍어도 판정 없이 바꿔요.
 * 파일 고르기는 버튼을 누른 그 순간에 열어야 해서(사파리 제한) 숨은 input을 함께 돌려줘요.
 */
export function usePhotoSubmission(
  missionId: number,
  options: {
    additional: boolean;
    retake: boolean;
    /** 판정 3번 실패 뒤의 직접 완료이거나, 직접 완료한 미션의 사진 바꾸기라 판정 없이 올리는지 */
    manual: boolean;
    tripId: string | null;
    onChanged: () => void;
  },
) {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<Promise<PhotoCoordinates | null> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<SubmissionNotice | null>(null);
  /** 판정 없이 올리는 동안 보여줄 고른 사진 */
  const [uploadingPreviewUrl, setUploadingPreviewUrl] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);

  const openCamera = () => {
    // 위치 권한 창이 사진 찍는 동안 함께 뜨도록 누른 순간에 요청을 시작해요.
    positionRef.current = getCurrentPosition();
    // 휴대폰은 기본 카메라 앱을 열고, 바로 촬영을 지원하지 않는 PC 브라우저는 화면 안 카메라를 켜요.
    if (supportsNativeCapture()) cameraInputRef.current?.click();
    else setCameraOpen(true);
  };
  const openLibrary = () => libraryInputRef.current?.click();

  const handleInput = (event: ChangeEvent<HTMLInputElement>, source: Source) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void submitFile(file, source);
  };

  const submitFile = async (file: File, source: Source) => {
    setSubmitting(true);
    let previewUrl: string | null = null;
    try {
      const [coordinates, photo] = await Promise.all([
        source === 'camera' ? (positionRef.current ?? Promise.resolve(null)) : readExifGps(file),
        prepareUploadImage(file),
      ]);
      const idempotencyKey = generateUuidV7();

      if (options.additional) {
        await addGroupMissionPhoto(missionId, photo, coordinates, idempotencyKey);
        toast.success('사진을 추가했어요.');
        options.onChanged();
        return;
      }

      if (options.manual) {
        setUploadingPreviewUrl(URL.createObjectURL(photo));
        await completeMissionManuallyWithPhoto(missionId, photo, coordinates, idempotencyKey);
        toast.success(options.retake ? '사진을 바꿨어요.' : '미션을 직접 완료했어요.');
        options.onChanged();
        return;
      }

      previewUrl = createPreviewUrl(photo);
      const verdict = await submitMissionPhoto(missionId, photo, coordinates, idempotencyKey);
      const mission = await getPhotoMissionDetail(missionId).catch(() => null);
      // 판정 화면에서 다시 찍으면 이전 판정을 기록에 남기지 않아요(이전 미리보기는 해제돼서).
      const onResultPage = window.location.pathname.endsWith('/result');

      const state: VerdictState = { verdict, previewUrl, mission, retake: options.retake };
      const query = options.tripId ? `?tripId=${encodeURIComponent(options.tripId)}` : '';
      navigate(`/photo-missions/missions/${missionId}/result${query}`, {
        state,
        replace: onResultPage,
      });
      previewUrl = null; // 다음 사진을 올릴 때 해제해요
    } catch (error) {
      handleError(error);
    } finally {
      if (previewUrl) discardPreviewUrl(previewUrl);
      setSubmitting(false);
      setUploadingPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      positionRef.current = null;
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof UnsupportedImageError) {
      toast.error('이 사진은 올릴 수 없어요. 다른 사진을 골라 주세요.');
      return;
    }
    const code = getApiErrorCode(error);
    if (code === PHOTO_MISSION_ERROR_CODES.manualCompletionNotAllowed) {
      toast.error('지금은 직접 완료할 수 없어요.');
      options.onChanged();
      return;
    }
    if (code === PHOTO_MISSION_ERROR_CODES.submissionNotAllowed) {
      toast.error('지금은 이 미션에 사진을 올릴 수 없어요.');
      options.onChanged();
      return;
    }
    // 대기 시간이 끝났거나(판정은 계속될 수 있음) AI 서버가 잠시 응답하지 않으면, 같은 요청을 다시 보내지 않고
    // 결과가 나중에 반영되도록 안내해요. 백엔드가 AI 판정을 자동으로 다시 시도해요.
    const timedOut =
      axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
    if (timedOut && options.manual) {
      setNotice({
        title: '완료 처리가 늦어지고 있어요',
        description: '잠시 후 미션을 다시 확인해 주세요.',
      });
      options.onChanged();
      return;
    }
    if (timedOut || code === 'SERVICE_UNAVAILABLE') {
      setNotice({
        title: '판정 결과가 늦어지고 있어요',
        description: '사진은 받았어요. 판정이 끝나면 미션 목록에 자동으로 반영돼요.',
      });
      options.onChanged();
      return;
    }
    toast.error('사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
  };

  const inputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => handleInput(event, 'camera')}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => handleInput(event, 'library')}
      />
      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onPickFile={() => {
            setCameraOpen(false);
            libraryInputRef.current?.click();
          }}
          onCapture={(photo) => {
            setCameraOpen(false);
            void submitFile(photo, 'camera');
          }}
        />
      )}
    </>
  );

  return {
    inputs,
    openCamera,
    openLibrary,
    submitting,
    uploadingPreviewUrl,
    notice,
    clearNotice: () => setNotice(null),
  };
}
