import type { ReactNode } from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  /** 점선 상자 안에 들어갈 아이콘이나 기호 */
  icon: ReactNode;
  title: string;
  description: string;
  /** 아래에 둘 버튼 등 */
  children?: ReactNode;
}

/** 빈 상태·오류 상태처럼 점선 상자 아이콘, 제목, 설명을 가운데에 보여줍니다. */
export default function StatusMessage({ icon, title, description, children }: StatusMessageProps) {
  return (
    <section className={styles.container}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {children && <div className={styles.actions}>{children}</div>}
    </section>
  );
}
