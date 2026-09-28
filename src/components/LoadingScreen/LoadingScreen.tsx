import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  title?: string;
  description?: string;
}

/** 화면 전체를 채우는 로딩 표시입니다. 제목을 주면 스피너 아래에 안내 문구를 보여줍니다. */
export default function LoadingScreen({ title, description }: LoadingScreenProps) {
  return (
    <div className={styles.container} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      {title ? (
        <>
          <p className={styles.title}>{title}</p>
          {description && <p className={styles.description}>{description}</p>}
        </>
      ) : (
        <span className={styles.srOnly}>불러오는 중</span>
      )}
    </div>
  );
}
