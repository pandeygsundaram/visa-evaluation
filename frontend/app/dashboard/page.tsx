'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useVisaStore } from '@/lib/stores/visaStore';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Globe, Key, FileText, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { countries, fetchCountries } = useVisaStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

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
      value: user?.evaluations?.length || 0,
      icon: FileText,
      href: '/dashboard',
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
