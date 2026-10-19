import { createElement } from 'react';
import {
  CloudLightningIcon,
  CloudRainIcon,
  CloudRainWindIcon,
  CloudSnowIcon,
  CloudSunRainIcon,
  HazeIcon,
  LuggageIcon,
  ThermometerSnowflakeIcon,
  ThermometerSunIcon,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { NotificationType, WeatherCondition } from '../api/notifications';
import { addDays, getToday } from '../utils/date';

// 백엔드 WeatherCondition과 같은 값이다. 날씨 분류가 바뀌면 이 표만 고치면 된다.
const WEATHER_ICONS: Record<WeatherCondition, LucideIcon> = {
  TYPHOON: CloudLightningIcon,
  HEAVY_RAIN: CloudRainWindIcon,
  HEAVY_SNOW: CloudSnowIcon,
  HEAT: ThermometerSunIcon,
  COLD: ThermometerSnowflakeIcon,
  RAIN: CloudRainIcon,
  YELLOW_DUST: HazeIcon,
  FINE_DUST: HazeIcon,
};

/** 알림 유형과 날씨에 맞는 아이콘. 알 수 없는 날씨는 일반 날씨 아이콘을 쓴다. */
export function getNotificationIcon(
  type: NotificationType,
  weatherCondition: WeatherCondition | null,
): LucideIcon {
  if (type !== 'TRIP_WEATHER_ALERT') return LuggageIcon;
  return weatherCondition ? WEATHER_ICONS[weatherCondition] : CloudSunRainIcon;
}

interface NotificationTypeIconProps extends LucideProps {
  type: NotificationType;
  weatherCondition: WeatherCondition | null;
}

/** 알림 유형(날씨) 아이콘 */
export function NotificationTypeIcon({
  type,
  weatherCondition,
  ...props
}: NotificationTypeIconProps) {
  return createElement(getNotificationIcon(type, weatherCondition), props);
}

const seoulDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * D-1 알림은 여행 전날 만들어지므로 생성일 다음 날이 여행 시작일이다.
 * 서울 기준 그날이 되면(여행 중·여행 종료 후) 더 이상 일정 변경에 응답할 수 없다.
 */
export function isResponseClosed(createdAt: string): boolean {
  const createdDate = seoulDateFormatter.format(new Date(createdAt));
  return getToday() >= addDays(createdDate, 1);
}

export const RESPONSE_CLOSED_MESSAGE = '여행이 시작되어 더 이상 응답할 수 없어요.';
