'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
