'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageCircle, Plus, Package, BookOpen, Settings, Activity,
  ShieldCheck, Zap, WifiOff
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

const NAV_ITEMS = [
  {
    href: '/chat',
    icon: MessageCircle,
    label: 'Chat',
    description: 'Ask AfyaPack',
    primary: true,
  },
  { href: '/encounter', icon: Plus, label: 'New Encounter' },
  { href: '/protocols', icon: BookOpen, label: 'Protocols' },
  { href: '/stock', icon: Package, label: 'Stock' },
];

const BOTTOM_NAV = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { modelReady, modelName, mockMode } = useSystemStatus();
  const isOnline = useOfflineStatus();

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 shrink-0 overflow-hidden"
      style={{ background: 'hsl(var(--nav))' }}>

      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'hsl(var(--nav-border))' }}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--primary))' }}>
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-[15px] tracking-tight leading-none">AfyaPack</div>
            <div className="text-[10px] font-medium mt-0.5 uppercase tracking-widest"
              style={{ color: 'hsl(var(--nav-text))' }}>
              AI Health
            </div>
          </div>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'nav-item group',
                active && 'nav-item-active',
                primary && !active && 'relative',
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-[hsl(170,80%,70%)]' : 'text-nav-text group-hover:text-white',
                )}
              />
              <span className="truncate">{label}</span>
              {primary && !active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 border-t" style={{ borderColor: 'hsl(var(--nav-border))' }} />

        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn('nav-item group', active && 'nav-item-active')}
            >
              <Icon size={17} className={cn(
                'shrink-0 transition-colors',
                active ? 'text-[hsl(170,80%,70%)]' : 'text-nav-text group-hover:text-white',
              )} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer card */}
      <div className="px-3 pb-4 pt-2">
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'hsl(var(--nav-border) / 0.35)' }}>
          {/* AI pulse row */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              modelReady ? 'bg-emerald-400 animate-pulse-soft' : 'bg-primary animate-pulse-soft',
            )} />
            <span className="text-[10px] font-semibold text-white/70 tracking-wide">
              {modelReady ? modelName : 'Local AI · Offline-ready'}
            </span>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white/60"
              style={{ background: 'hsl(var(--nav-border) / 0.5)' }}>
              <ShieldCheck size={8} />
              Private
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white/60"
              style={{ background: 'hsl(var(--nav-border) / 0.5)' }}>
              <Zap size={8} />
              Protocol-grounded
            </span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-amber-400/80"
                style={{ background: 'hsl(var(--nav-border) / 0.5)' }}>
                <WifiOff size={8} />
                Offline
              </span>
            )}
          </div>

          <div className="text-[9px] font-medium uppercase tracking-widest text-white/20 pt-0.5">
            AfyaPack v1.0
          </div>
        </div>
      </div>
    </aside>
  );
}
