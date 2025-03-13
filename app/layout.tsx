'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determine which tab is active
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Crypto Dashboard
              </Link>
              
              <nav className="flex space-x-8">
                <Link 
                  href="/"
                  className={`${
                    isActive('/') 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-gray-900'
                  } pb-2 px-1`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/indicators"
                  className={`${
                    isActive('/indicators') 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-gray-900'
                  } pb-2 px-1`}
                >
                  Indicators
                </Link>
                <Link 
                  href="/indicators/crowding"
                  className={`${
                    isActive('/indicators/crowding') 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-gray-900'
                  } pb-2 px-1`}
                >
                  BTC Crowding
                </Link>
              </nav>
            </div>
          </div>
        </header>
        
        {children}
      </body>
    </html>
  );
}
