import styles from './Home.module.css';

export default function Home() {
  return (
    <section className={styles.container}>
      <h1 className={styles.title}>프로젝트 시작</h1>
      <p className={styles.description}>화면 설계서가 전달되면 이 페이지부터 구현을 시작합니다.</p>
    </section>
  );
}
