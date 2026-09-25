import { NavLink } from 'react-router-dom';
import { ChatIcon, HomeIcon, UsersIcon } from '../Icon/icons';
import styles from './BottomTabBar.module.css';

const TABS = [
  { to: '/', label: '메인', Icon: HomeIcon },
  { to: '/chat', label: '오픈채팅', Icon: ChatIcon },
  { to: '/community', label: '커뮤니티', Icon: UsersIcon },
] as const;

/** 화면 하단에 고정되는 메인 탭 메뉴입니다. */
export default function BottomTabBar() {
  return (
    <nav className={styles.bar} aria-label="주요 메뉴">
      <ul className={styles.list}>
        {TABS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
