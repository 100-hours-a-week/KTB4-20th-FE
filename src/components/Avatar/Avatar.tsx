import { useState } from 'react';
import { getProfileInitial, isDefaultProfileImage } from '../../utils/profileInitial';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** true면 글자 배경을 회색으로 보여줍니다. (나 이외의 멤버 등) */
  muted?: boolean;
  /** true면 방장 표시로 브라운 배경에 크림 글자를 씁니다. */
  host?: boolean;
}

/**
 * 프로필 사진을 보여주고, 사진이 없거나(기본 이미지 포함) 불러오지 못하면
 * 이름의 첫 글자(한국 이름은 성을 뺀 첫 글자)를 보여줍니다.
 */
export default function Avatar({
  name,
  imageUrl,
  size = 'md',
  muted = false,
  host = false,
}: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage =
    Boolean(imageUrl) && failedUrl !== imageUrl && !isDefaultProfileImage(imageUrl ?? '');
  const initial = getProfileInitial(name);

  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${muted ? styles.muted : ''} ${host ? styles.host : ''}`}
    >
      {showImage && imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={styles.image}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

interface AvatarGroupProps {
  members: { name: string; imageUrl?: string | null }[];
  max?: number;
  size?: 'xs' | 'sm';
}

/**
 * 여러 명의 프로필을 겹쳐서 보여줍니다. 첫 번째 멤버만 방장 색으로 칠하고 나머지는 회색입니다.
 * 백엔드는 멤버를 참여 순서로 보내고, 방장이 나가면 가장 먼저 참여한 멤버에게 방장을 넘기므로
 * 목록의 첫 멤버가 항상 방장입니다.
 */
export function AvatarGroup({ members, max = 5, size = 'sm' }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const hiddenCount = members.length - visible.length;

  return (
    <ul className={styles.group} aria-label={`참여자 ${members.map((m) => m.name).join(', ')}`}>
      {visible.map((member, index) => (
        <li key={`${member.name}-${index}`} className={styles.groupItem}>
          <Avatar
            name={member.name}
            imageUrl={member.imageUrl}
            size={size}
            host={index === 0}
            muted={index !== 0}
          />
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className={`${styles.groupItem} ${styles.more} ${styles[size]}`} aria-hidden="true">
          +{hiddenCount}
        </li>
      )}
    </ul>
  );
}
