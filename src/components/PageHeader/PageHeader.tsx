import { ChevronLeftIcon } from '../Icon/icons';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  /** 제목을 가운데에 둘지 여부입니다. 기본은 뒤로가기 버튼 옆(왼쪽)입니다. */
  centered?: boolean;
}

/** 뒤로가기 버튼과 제목이 있는 화면 상단 영역입니다. */
export default function PageHeader({ title, onBack, centered = false }: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${centered ? styles.centered : ''}`}>
      <button type="button" className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
        <ChevronLeftIcon size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
