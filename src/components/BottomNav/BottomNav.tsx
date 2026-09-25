import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: (active: boolean) => ReactElement;
}

function HomeIcon(active: boolean) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon(active: boolean) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommunityIcon(active: boolean) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      <path
        d="M5 19c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '메인', icon: HomeIcon },
  { to: '/open-chat', label: '오픈 채팅', icon: ChatIcon },
  { to: '/community', label: '커뮤니티', icon: CommunityIcon },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="주요 화면 이동">
      <ul className={styles.list}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <li key={to} className={styles.item}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            >
              {({ isActive }) => (
                <>
                  {icon(isActive)}
                  <span className={styles.label}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
