# Prompt: Next.js Scaffold

## Description
Create a Next.js 14 application with App Router, Tailwind CSS, and basic layout structure.

---

## The Prompt

```
Create a Next.js 14 application with:
1. App Router structure (src/app/)
2. Tailwind CSS configured with custom colors
3. Root layout with metadata and font configuration
4. Home page with basic welcome content
5. Global CSS file with Tailwind directives
6. API utility for backend communication
7. Components folder structure (ui/, layout/)
8. Responsive design utilities

Use src/ directory. Configure for standalone output.
```

---

## Expected Output

### web/src/app/layout.js
```javascript
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AfyaPack',
  description: 'Offline-first AI health decision support',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### web/src/app/page.js
```javascript
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        AfyaPack
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Offline-first AI health decision support for community health workers
      </p>
      <Link 
        href="/chat"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Chat
      </Link>
    </div>
  );
}
```

### web/src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### web/src/lib/api.js
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return res.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
```

### web/tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

### web/next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;
```

---

## Folder Structure

```
web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── manifest.json
└── src/
    ├── app/
    │   ├── layout.js
    │   ├── page.js
    │   └── globals.css
    ├── components/
    │   ├── ui/
    │   └── layout/
    ├── lib/
    │   └── api.js
    └── hooks/
```

---

## Variations

### With PWA Support
```
Add next-pwa configuration for offline support. Include service worker and manifest.json for installable app.
```

### With Dark Mode
```
Add dark mode support using Tailwind's dark: variant and a theme toggle component.
```

### With Authentication
```
Add NextAuth.js for authentication with session management and protected routes.
```
