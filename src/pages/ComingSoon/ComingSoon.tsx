import { Link } from 'react-router-dom';
import styles from '../PagePlaceholder.module.css';

interface ComingSoonProps {
  title: string;
}

/** 화면설계서가 아직 전달되지 않은 화면에 임시로 보여줍니다. */
export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>준비 중인 화면이에요.</p>
      <Link className={styles.link} to="/">
        메인으로 이동
      </Link>
    </main>
  );
}
