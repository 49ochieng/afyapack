'use client';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

export function AppShell({ children, rightPanel, className, fullHeight }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar / nav rail */}
      <Sidebar />

      {/* Main content */}
      <main className={cn(
        'flex-1 min-w-0 flex flex-col',
        'pb-20 lg:pb-0',  // safe space for mobile bottom nav
        fullHeight && 'h-screen overflow-hidden',
        className,
      )}>
        {children}
      </main>

      {/* Right context panel (xl+ only) */}
      {rightPanel}

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
