import { useId, type ReactNode } from 'react';
import styles from './RegionIllustration.module.css';

type RegionKey = 'SEOUL' | 'GYEONGJU' | 'BUSAN' | 'JEONJU' | 'JEJU';

/** 백엔드 지역 코드(REGION-SEOUL 등)나 이름(서울 등)으로 그림을 고릅니다. */
const REGION_BY_NAME: Record<string, RegionKey> = {
  서울: 'SEOUL',
  경주: 'GYEONGJU',
  부산: 'BUSAN',
  전주: 'JEONJU',
  제주: 'JEJU',
};

function toRegionKey(regionCode?: string, regionName?: string): RegionKey | null {
  const fromCode = regionCode?.replace(/^REGION-/, '');
  if (fromCode && Object.values(REGION_BY_NAME).includes(fromCode as RegionKey)) {
    return fromCode as RegionKey;
  }
  return regionName ? (REGION_BY_NAME[regionName] ?? null) : null;
}

/* 모든 풍경은 200×110 틀에 그린다. 하늘과 땅은 틀 양옆으로 넓게 이어 그려, 상자가 더 넓어도 빈틈 없이 채운다.
   색은 variables.css의 --scene-* */
function Sky({ color }: { color: string }) {
  return <rect x="-600" y="-600" width="1400" height="710" style={{ fill: `var(${color})` }} />;
}

function Sun({ cx, cy, r = 12 }: { cx: number; cy: number; r?: number }) {
  return <circle className={styles.sun} cx={cx} cy={cy} r={r} />;
}

/** 서울: 뒤편 빌딩 숲, 남산과 N서울타워 */
function Seoul() {
  return (
    <>
      <Sky color="--scene-sky-seoul" />
      <Sun cx={166} cy={26} />
      <path
        className={styles.buildingDark}
        d="M104 110 V70 H118 V60 H132 V76 H146 V52 H162 V72 H176 V64 H200 V110 Z"
      />
      <path
        className={styles.building}
        d="M120 110 V82 H134 V74 H150 V86 H168 V78 H184 V90 H200 V110 Z"
      />
      <rect className={styles.building} x="198" y="90" width="600" height="20" />
      <rect className={styles.hill} x="-600" y="104" width="600" height="6" />
      <path className={styles.hill} d="M-10 110 Q60 46 132 110 Z" />
      <path className={styles.line} d="M-10 110 Q60 46 132 110" />
      <path className={styles.line} d="M61 20 V34" />
      <rect className={styles.paper} x="57" y="34" width="8" height="46" rx="2" />
      <rect className={styles.paper} x="48" y="40" width="26" height="11" rx="4" />
      <path className={styles.thin} d="M52 45.5 H70" />
    </>
  );
}

/** 경주: 노을 하늘, 둥근 고분들, 첨성대 */
function Gyeongju() {
  const clipId = useId();
  const body = 'M78 102 C84 82 94 64 95 46 H113 C114 64 124 82 130 102 Z';
  return (
    <>
      <Sky color="--scene-sky-gyeongju" />
      <Sun cx={42} cy={34} r={16} />
      <path className={styles.hillDark} d="M120 110 Q156 58 196 110 Z" />
      <path className={styles.hill} d="M-6 110 Q30 66 70 110 Z" />
      <path className={styles.hill} d="M150 110 Q182 76 214 110 Z" />
      <defs>
        <clipPath id={clipId}>
          <path d={body} />
        </clipPath>
      </defs>
      <path className={styles.stone} d={body} />
      <g clipPath={`url(#${clipId})`}>
        <path
          className={styles.thin}
          d="M60 94 H150 M60 86 H150 M60 78 H150 M60 70 H150 M60 62 H150 M60 54 H150"
        />
      </g>
      <path className={styles.line} d={body} fill="none" />
      <rect className={styles.ink} x="99" y="68" width="10" height="10" rx="1" />
      <rect className={styles.stone} x="91" y="36" width="26" height="10" />
      <rect className={styles.line} x="91" y="36" width="26" height="10" fill="none" />
      <rect className={styles.ground} x="-600" y="102" width="1400" height="8" />
    </>
  );
}

/** 부산: 바다와 광안대교 */
function Busan() {
  return (
    <>
      <Sky color="--scene-sky-busan" />
      <Sun cx={100} cy={28} />
      <rect className={styles.sea} x="-600" y="74" width="1400" height="36" />
      <rect className={styles.seaDeep} x="-600" y="96" width="1400" height="14" />
      <path
        className={styles.seaDeep}
        d="M0 92 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V110 H0 Z"
      />
      <path className={styles.cable} d="M0 56 Q30 74 58 36 Q100 82 142 36 Q170 74 200 56" />
      <path
        className={styles.hanger}
        d="M18 62 V74 M34 64 V74 M78 56 V74 M100 60 V74 M122 56 V74 M166 64 V74 M182 62 V74"
      />
      <rect className={styles.paper} x="54" y="32" width="8" height="54" rx="1" />
      <rect className={styles.paper} x="138" y="32" width="8" height="54" rx="1" />
      <rect className={styles.ink} x="-600" y="72" width="1400" height="4" />
    </>
  );
}

/** 전주: 한옥 기와지붕과 둥근 나무 */
function Jeonju() {
  return (
    <>
      <Sky color="--scene-sky-jeonju" />
      <Sun cx={166} cy={26} />
      <circle className={styles.leaf} cx="22" cy="80" r="18" />
      <circle className={styles.leafLight} cx="182" cy="84" r="16" />
      <rect className={styles.ground} x="-600" y="100" width="1400" height="10" />
      <path
        className={styles.ink}
        d="M24 58 Q42 68 64 62 Q100 46 136 62 Q158 68 176 58 L160 74 H40 Z"
      />
      <rect className={styles.wall} x="48" y="74" width="104" height="26" />
      <path
        className={styles.line}
        d="M48 74 H152 V100 H48 Z M74 74 V100 M100 74 V100 M126 74 V100"
      />
      <path
        className={styles.thin}
        d="M81 81 H93 M81 87 H93 M81 93 H93 M107 81 H119 M107 87 H119 M107 93 H119"
      />
    </>
  );
}

/** 제주: 한라산, 유채꽃 들판, 돌하르방 */
function Jeju() {
  return (
    <>
      <Sky color="--scene-sky-jeju" />
      <Sun cx={40} cy={26} />
      <path className={styles.hillDark} d="M-10 96 L62 46 Q74 38 86 46 L160 96 Z" />
      <path className={styles.line} d="M-10 96 L62 46 Q74 38 86 46 L160 96" />
      <rect className={styles.canola} x="-600" y="92" width="1400" height="18" />
      <path className={styles.leafLine} d="M-600 94 H800" />
      <g className={styles.flowers}>
        <circle cx="12" cy="100" r="3" />
        <circle cx="26" cy="104" r="3" />
        <circle cx="44" cy="99" r="3" />
        <circle cx="62" cy="105" r="3" />
        <circle cx="80" cy="100" r="3" />
        <circle cx="98" cy="104" r="3" />
        <circle cx="186" cy="101" r="3" />
      </g>
      <path className={styles.basalt} d="M138 40 Q150 20 162 40 Z" />
      <rect className={styles.basalt} x="133" y="38" width="34" height="7" rx="3.5" />
      <rect className={styles.basalt} x="137" y="45" width="26" height="55" rx="11" />
      <path className={styles.line} d="M138 40 Q150 20 162 40 M133 41.5 H167" />
      <rect className={styles.line} x="137" y="45" width="26" height="55" rx="11" fill="none" />
      <path className={styles.thinLight} d="M141 78 Q150 74 159 78 M141 86 Q150 82 159 86" />
    </>
  );
}

/** 지역을 모를 때: 산과 해 */
function Fallback() {
  return (
    <>
      <Sky color="--scene-sky-seoul" />
      <Sun cx={160} cy={30} />
      <path className={styles.hillDark} d="M-10 110 L60 50 L100 86 L132 62 L210 110 Z" />
      <path className={styles.line} d="M-10 110 L60 50 L100 86 L132 62 L210 110" />
      <rect className={styles.hillDark} x="-600" y="104" width="1400" height="6" />
    </>
  );
}

const ILLUSTRATIONS: Record<RegionKey, () => ReactNode> = {
  SEOUL: Seoul,
  GYEONGJU: Gyeongju,
  BUSAN: Busan,
  JEONJU: Jeonju,
  JEJU: Jeju,
};

interface RegionIllustrationProps {
  regionCode?: string;
  regionName?: string;
  className?: string;
}

/**
 * 여행지 풍경 그림입니다. 사진 대신 쓰도록 하늘부터 틀을 가득 채워 그립니다.
 * 그림 전체가 상자 높이에 맞게 줄어 잘리지 않고, 남는 양옆은 하늘과 땅이 이어져 채웁니다. 장식이라 화면 낭독기는 읽지 않습니다.
 */
export default function RegionIllustration({
  regionCode,
  regionName,
  className,
}: RegionIllustrationProps) {
  const key = toRegionKey(regionCode, regionName);
  const Illustration = key ? ILLUSTRATIONS[key] : Fallback;

  return (
    <svg
      className={`${styles.svg} ${className ?? ''}`}
      viewBox="0 0 200 110"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <Illustration />
    </svg>
  );
}
