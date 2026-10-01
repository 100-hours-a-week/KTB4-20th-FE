import { Link } from 'react-router-dom';
import RegionIllustration from '../../components/RegionIllustration/RegionIllustration';
import styles from '../PagePlaceholder.module.css';

export default function NotFound() {
  return (
    <main className={styles.container}>
      <div className={styles.scene} aria-hidden="true">
        <RegionIllustration />
      </div>
      <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
      <p className={styles.description}>주소를 확인하거나 홈으로 이동해 주세요</p>
      <Link className={styles.link} to="/">
        홈으로 이동
      </Link>
    </main>
  );
}
