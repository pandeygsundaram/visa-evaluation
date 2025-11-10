'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useVisaStore } from '@/lib/stores/visaStore';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Globe, Key, FileText, Calendar, Zap, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { countries, fetchCountries } = useVisaStore();
  const router = useRouter();
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [evaluationsCount, setEvaluationsCount] = useState(0);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);

  useEffect(() => {
    fetchCountries();
    fetchQuotaInfo();
    fetchEvaluationsCount();
  }, [fetchCountries]);

  // Refresh quota info when user returns to the page (e.g., after upgrading)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchQuotaInfo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchQuotaInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setQuotaInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    } finally {
      setLoadingQuota(false);
    }
  };

  const fetchEvaluationsCount = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/evaluations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEvaluationsCount(data.data?.evaluations?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const stats = [
    {
      name: 'Available Countries',
      value: countries.length,
      icon: Globe,
      href: '/dashboard/visa-config',
    },
    {
      name: 'Active API Keys',
      value: user?.apiKeys?.filter((k) => k.isActive).length || 0,
      icon: Key,
      href: '/dashboard/api-keys',
    },
    {
      name: 'Evaluations',
      value: loadingEvaluations ? '...' : evaluationsCount,
      icon: FileText,
      href: '/dashboard/evaluations',
    },
  ];

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Here's an overview of your visa evaluation journey
        </p>
      </div>

      {/* Subscription/Quota Card */}
      {!loadingQuota && quotaInfo && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {quotaInfo.plan?.name || 'Free'} Plan
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {quotaInfo.callsRemaining} of {quotaInfo.callsLimit} evaluations remaining this month
                </p>
              </div>
              {quotaInfo.plan?.tier === 'free' && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade
                </button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="w-full bg-[var(--muted)] rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    quotaInfo.callsRemaining === 0
                      ? 'bg-[var(--error)]'
                      : quotaInfo.callsRemaining <= 1
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--success)]'
                  }`}
                  style={{ width: `${(quotaInfo.callsRemaining / quotaInfo.callsLimit) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  {quotaInfo.callsUsed} used
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {quotaInfo.callsRemaining} remaining
                </span>
              </div>
              {quotaInfo.plan?.tier === 'free' && quotaInfo.callsRemaining <= 1 && (
                <div className="mt-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded-lg">
                  <p className="text-sm text-[var(--foreground)]">
                    You're running low on evaluations! Upgrade to Pro for thousands of evaluations per month.
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-[var(--muted-foreground)] truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-3xl font-semibold text-[var(--foreground)]">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Account Information
            </h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Email</dt>
                <dd className="text-sm text-[var(--foreground)]">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">
                  Account Type
                </dt>
                <dd className="text-sm text-[var(--foreground)]">
                  {user?.provider === 'google' ? 'Google OAuth' : 'Email/Password'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">
                  Member Since
                </dt>
                <dd className="text-sm text-[var(--foreground)] flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Quick Actions
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Link
                href="/dashboard/visa-config"
                className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-[var(--primary)] mr-3" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Explore Visa Options
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Browse available countries and visa types
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/api-keys"
                className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center">
                  <Key className="w-5 h-5 text-[var(--primary)] mr-3" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Manage API Keys
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Create and manage your API access keys
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
