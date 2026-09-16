import styles from '../PagePlaceholder.module.css';

export default function OAuthResult() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>로그인 처리</h1>
      <p className={styles.description}>로그인 결과를 확인하고 있습니다.</p>
    </main>
  );
}
