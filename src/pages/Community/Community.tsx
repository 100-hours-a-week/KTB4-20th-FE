import BottomNav from '../../components/BottomNav/BottomNav';
import styles from '../PagePlaceholder.module.css';

export default function Community() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>커뮤니티</h1>
      <p className={styles.description}>커뮤니티 화면이 구현될 예정입니다.</p>
      <BottomNav />
    </main>
  );
}
