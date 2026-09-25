import { useState } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** true면 글자 배경을 회색으로 보여줍니다. (나 이외의 멤버 등) */
  muted?: boolean;
}

/** 프로필 사진을 보여주고, 사진이 없거나 불러오지 못하면 이름의 첫 글자를 보여줍니다. */
export default function Avatar({ name, imageUrl, size = 'md', muted = false }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;
  const initial = Array.from(name.trim())[0] ?? '';

  return (
    <span className={`${styles.avatar} ${styles[size]} ${muted ? styles.muted : ''}`}>
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
}

/** 여러 명의 프로필을 겹쳐서 보여줍니다. */
export function AvatarGroup({ members, max = 5 }: AvatarGroupProps) {
  const visible = members.slice(0, max);

  return (
    <ul className={styles.group} aria-label={`참여자 ${members.map((m) => m.name).join(', ')}`}>
      {visible.map((member, index) => (
        <li key={`${member.name}-${index}`} className={styles.groupItem}>
          <Avatar name={member.name} imageUrl={member.imageUrl} size="sm" />
        </li>
      ))}
    </ul>
  );
}
