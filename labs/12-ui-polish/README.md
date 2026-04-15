# Lesson 12: UI Polish

> Add animations, transitions, and professional flourishes.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 35 minutes |
| **Objective** | Create a polished, event-worthy UI experience |
| **Output** | Smooth animations, responsive design, micro-interactions |
| **Prerequisites** | Lesson 11 (Multilingual support complete) |
| **Files/Folders** | `web/src/components/`, `web/src/app/globals.css` |

---

## What Makes the "Wow Factor"

```
Before Polish:              After Polish:
┌─────────────────┐        ┌─────────────────┐
│ Alert: Danger   │        │ ▓░░░░░░░░░░░░▓ │ ← Animated gradient
│                 │        │ ⚠️ Alert       │ ← Icon pulse
│ [Button]        │        │                 │
│                 │        │ [✨ Button →]   │ ← Hover transform
└─────────────────┘        └─────────────────┘
                                    ↑
                            Slide-in animation
```

**The details:**
- Page transitions (fade/slide)
- Button hover states
- Loading skeletons
- Toast notifications
- Micro-interactions
- Mobile-responsive layout

---

## Step 1: Configure Framer Motion

Ensure Framer Motion is installed in your project.

Create `web/src/components/ui/motion.jsx` for shared animation variants:

```jsx
'use client';

import { motion } from 'framer-motion';

// Page transition wrapper
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Staggered list animation
export function StaggeredList({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

// Card entrance
export function AnimatedCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulse animation for alerts
export function PulseIndicator({ color = 'red', size = 3 }) {
  return (
    <span className="relative flex items-center justify-center">
      <motion.span
        className={`absolute w-${size} h-${size} rounded-full bg-${color}-400`}
        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className={`w-${size} h-${size} rounded-full bg-${color}-500`} />
    </span>
  );
}

// Skeleton loader
export function Skeleton({ className }) {
  return (
    <motion.div
      className={`bg-gray-200 rounded ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

// Number count up animation
export function CountUp({ end, duration = 1 }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ value: 0 }}
        animate={{ value: end }}
        transition={{ duration }}
      >
        {end}
      </motion.span>
    </motion.span>
  );
}
```

---

## Step 2: Create Loading Skeletons

Create `web/src/components/ui/skeletons.jsx`:

```jsx
import { Skeleton } from './motion';

// Chat message skeleton
export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Stats card skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="border rounded-xl p-4">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ))}
    </div>
  );
}
```

---

## Step 3: Add Toast Notifications

Create `web/src/components/ui/toast.jsx`:

```jsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = ICONS[toast.type];
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                  ${COLORS[toast.type]}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <p className="flex-1">{toast.message}</p>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-black/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  
  return {
    success: (msg) => context.addToast(msg, 'success'),
    error: (msg) => context.addToast(msg, 'error'),
    info: (msg) => context.addToast(msg, 'info'),
  };
}
```

---

## Step 4: Enhanced Button Styles

Update `web/src/components/ui/button.jsx`:

```jsx
'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'hover:bg-gray-100',
  link: 'text-blue-600 underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-12 px-8 text-lg',
  icon: 'h-10 w-10',
};

const Button = forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default',
  children,
  ...props 
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
export { Button };
```

---

## Step 5: Create App Shell with Navigation

Create `web/src/components/layout/AppShell.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, ClipboardPlus, Package, Settings, 
  Menu, X, Stethoscope 
} from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';

const NAV_ITEMS = [
  { path: '/', icon: Home, labelKey: 'nav_home' },
  { path: '/chat', icon: MessageSquare, labelKey: 'nav_chat' },
  { path: '/encounter', icon: ClipboardPlus, labelKey: 'nav_encounter' },
  { path: '/stock', icon: Package, labelKey: 'nav_stock' },
  { path: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <span className="font-bold">AfyaPack</span>
          </div>
        </div>
        <LanguageSwitcher />
      </header>
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r flex-col">
        <Sidebar />
      </aside>
      
      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-4 z-30">
        {NAV_ITEMS.slice(0, 4).map(item => {
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors
                ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { t } = useI18n();
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-blue-600" />
          <span className="font-bold text-lg">AfyaPack</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
```

---

## Step 6: Add Global Styles

Update `web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Focus styles */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Selection color */
::selection {
  background-color: #3b82f6;
  color: white;
}

/* Loading animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Prose styles for AI responses */
.prose-ai {
  @apply text-gray-800 leading-relaxed;
}

.prose-ai h2 {
  @apply text-lg font-semibold mt-4 mb-2 text-gray-900;
}

.prose-ai ul {
  @apply list-disc pl-5 my-2;
}

.prose-ai li {
  @apply my-1;
}

.prose-ai strong {
  @apply font-semibold text-gray-900;
}
```

---

## Validation Checklist

- [ ] Page transitions are smooth
- [ ] Buttons have hover/tap effects
- [ ] Loading states show skeletons
- [ ] Toasts appear and auto-dismiss
- [ ] Sidebar opens/closes smoothly on mobile
- [ ] Bottom nav highlights active route
- [ ] Scrolling is smooth
- [ ] Focus states are visible

---

## What You Learned

- How to use Framer Motion for animations
- How to create loading skeletons
- How to build toast notifications
- How to make responsive layouts
- How to add micro-interactions

---

## Next Step

**Proceed to Lesson 13:** Testing & Demo

You'll learn how to demo the app effectively.

---

*The app looks professional. Time to show it off. →*
