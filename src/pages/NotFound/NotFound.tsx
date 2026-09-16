import { Link } from 'react-router-dom';
import styles from '../PagePlaceholder.module.css';

export default function NotFound() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>페이지를 찾을 수 없습니다.</h1>
      <p className={styles.description}>주소를 확인하거나 홈으로 이동해 주세요.</p>
      <Link className={styles.link} to="/">
        홈으로 이동
      </Link>
    </main>
  );
}
