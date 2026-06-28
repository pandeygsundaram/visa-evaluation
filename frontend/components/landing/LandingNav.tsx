'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';

export default function LandingNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="flex items-center justify-between py-6">
      {/* Logo */}
      <div className="text-2xl font-bold tracking-tight text-white">VisaEval</div>

      {/* Pill nav — right side, frosted glass */}
      <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-2 py-1.5">
        <a href="#" className="text-white text-sm font-medium px-4 py-1.5 rounded-full bg-white/20 transition-colors">
          Home
        </a>
        <a href="#features" className="text-blue-100 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
          Solutions
        </a>
        <a href="#industries" className="text-blue-100 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
          About
        </a>
        <Link href="/pricing" className="text-blue-100 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
          Pricing
        </Link>
        {isAuthenticated ? (
          <Link href="/dashboard" className="text-blue-100 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
            Dashboard
          </Link>
        ) : (
          <Link href="/login" className="text-blue-100 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors">
            Sign in
          </Link>
        )}
      </div>

      {/* CTA button */}
      {!isAuthenticated && (
        <Link
          href="/signup"
          className="bg-white text-blue-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors shadow-md"
        >
          Get started
        </Link>
      )}
    </nav>
  );
}
