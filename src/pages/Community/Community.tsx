import BottomNav from '../../components/BottomNav/BottomNav';
import RegionIllustration from '../../components/RegionIllustration/RegionIllustration';
import styles from '../PagePlaceholder.module.css';

export default function Community() {
  return (
    <main className={`${styles.container} ${styles.withNav}`}>
      <div className={styles.scene} aria-hidden="true">
        <RegionIllustration regionName="경주" />
      </div>
      <h1 className={styles.title}>커뮤니티</h1>
      <p className={styles.description}>여행 후기를 나누는 공간을 준비하고 있어요</p>
      <BottomNav />
    </main>
  );
}
