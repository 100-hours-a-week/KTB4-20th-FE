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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
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
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[var(--color-text-muted-soft)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  // 선택된 탭은 위쪽에 포인트 색 선을 긋는다.
                  isActive &&
                    'text-foreground before:absolute before:top-[-1px] before:h-[3px] before:w-8 before:bg-[var(--color-point)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={cn('text-[11px]', isActive ? 'font-bold' : 'font-medium')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
