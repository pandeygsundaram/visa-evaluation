'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { User, Mail, Calendar, Shield, Key } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Profile</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          View your account information and settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Personal Information
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-[var(--muted-foreground)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      Full Name
                    </label>
                    <p className="text-base text-[var(--foreground)]">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-[var(--muted-foreground)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      Email Address
                    </label>
                    <p className="text-base text-[var(--foreground)]">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-[var(--muted-foreground)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      Authentication Method
                    </label>
                    <p className="text-base text-[var(--foreground)]">
                      {user.provider === 'google' ? (
                        <span className="inline-flex items-center">
                          Google OAuth
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            OAuth
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          Email & Password
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]">
                            Credentials
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-[var(--muted-foreground)] mr-3 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      Member Since
                    </label>
                    <p className="text-base text-[var(--foreground)]">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Account Statistics
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)]">
                  <div className="text-3xl font-bold text-[var(--primary)]">
                    {user.apiKeys?.length || 0}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Total API Keys</div>
                </div>
                <div className="text-center p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)]">
                  <div className="text-3xl font-bold text-[var(--success)]">
                    {user.apiKeys?.filter((k) => k.isActive).length || 0}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Active Keys</div>
                </div>
                <div className="text-center p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)]">
                  <div className="text-3xl font-bold text-[var(--accent)]">
                    {user.evaluations?.length || 0}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Evaluations</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Quick Info
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)]">User ID</p>
                  <code className="text-xs bg-[var(--muted)] px-2 py-1 rounded">
                    {user.id}
                  </code>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Account Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-[var(--muted)] border-[var(--border)]">
            <CardBody>
              <div className="flex items-start">
                <Key className="w-5 h-5 text-[var(--primary)] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                    Need API Access?
                  </h3>
                  <p className="text-xs text-[var(--foreground)] mb-3">
                    Generate API keys to integrate visa evaluation into your applications.
                  </p>
                  <a
                    href="/dashboard/api-keys"
                    className="text-xs font-medium text-[var(--primary)] hover:opacity-80"
                  >
                    Manage API Keys →
                  </a>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
