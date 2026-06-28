'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AuthNavbar() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Visa<span className="text-[#0066ff]">Eval</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            {isLoginPage ? (
              <Link href="/signup" className="bg-[#0066ff] text-white hover:bg-[#0047b3] px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                Sign up
              </Link>
            ) : (
              <Link href="/login" className="bg-[#0066ff] text-white hover:bg-[#0047b3] px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
