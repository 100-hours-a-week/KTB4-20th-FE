import { Home, MessageCircle, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '메인', Icon: Home },
  { to: '/open-chat', label: '오픈 채팅', Icon: MessageCircle },
  { to: '/community', label: '커뮤니티', Icon: Users },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background"
      aria-label="주요 화면 이동"
    >
      <ul className="mx-auto flex max-w-[480px]">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex h-16 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors',
                  isActive && 'text-primary before:absolute before:top-0 before:h-0.5 before:w-7 before:rounded-full before:bg-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className="text-[11px] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
