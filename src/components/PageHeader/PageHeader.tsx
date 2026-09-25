import { ChevronLeftIcon } from 'lucide-react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  /** 제목 아래 작은 글씨 (예: 여행 날짜와 인원) */
  subtitle?: string;
  onBack: () => void;
  /** 제목을 가운데에 둘지 여부입니다. 기본은 뒤로가기 버튼 옆(왼쪽)입니다. */
  centered?: boolean;
}

/** 뒤로가기 버튼과 제목이 있는 화면 상단 영역입니다. */
export default function PageHeader({ title, subtitle, onBack, centered = false }: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${centered ? styles.centered : ''}`}>
      <button type="button" className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
        <ChevronLeftIcon size={22} />
      </button>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </header>
  );
}
