'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, MessageCircle, Plus, Package, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',          icon: Home,          label: 'Home' },
  { href: '/chat',      icon: MessageCircle, label: 'Chat', primary: true },
  { href: '/encounter', icon: Plus,          label: 'Encounter' },
  { href: '/protocols', icon: BookOpen,      label: 'Protocols' },
  { href: '/stock',     icon: Package,       label: 'Stock' },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'hsl(var(--nav))',
        borderTop: '1px solid hsl(var(--nav-border))',
      }}>
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[9px] font-semibold uppercase tracking-wider transition-all duration-150',
                active
                  ? 'text-[hsl(170,80%,70%)]'
                  : primary
                  ? 'text-primary'
                  : 'text-[hsl(var(--nav-text))]',
              )}
            >
              {primary ? (
                <div className={cn(
                  'w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
                  active ? 'bg-primary/30' : 'bg-primary/15',
                )}>
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                </div>
              ) : (
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
