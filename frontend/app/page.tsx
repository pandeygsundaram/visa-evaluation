'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Globe, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    'Evaluate visa eligibility across multiple countries',
    'Get personalized recommendations based on your profile',
    'Access up-to-date visa requirements and documentation',
    'Track your visa application progress',
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Globe className="w-20 h-20 text-[var(--primary)]" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-6">
            Visa Evaluation Platform
          </h1>

          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-8 max-w-3xl mx-auto">
            Navigate your global mobility journey with confidence.
            Evaluate your visa eligibility across multiple countries in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => router.push('/signup')}
              className="text-lg px-8 py-6"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
              className="text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </div>

          {/* Features List */}
          <div className="max-w-2xl mx-auto">
            <div className="grid gap-4 text-left">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-[var(--card)] p-4 rounded-lg shadow-sm border border-[var(--border)]"
                >
                  <CheckCircle className="w-6 h-6 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <p className="text-[var(--card-foreground)]">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-[var(--muted-foreground)]">
            © 2025 Visa Evaluation Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
