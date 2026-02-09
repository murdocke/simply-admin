'use client';

import Link from 'next/link';

const roles = [
  {
    title: 'Company Admin',
    description: 'Full visibility across studios, billing, and global settings.',
    badges: ['Billing', 'Messaging', 'Curriculum', 'Analytics'],
  },
  {
    title: 'Teacher',
    description: 'Access to schedules, lesson prep, students, and teaching tools.',
    badges: ['Schedule', 'Lesson Prep', 'Students', 'Teaching Hub'],
  },
  {
    title: 'Student',
    description: 'Lesson access, practice progress, and communication tools.',
    badges: ['Lesson Library', 'Practice Hub', 'Messages', 'Playlist'],
  },
];

const permissions = [
  {
    group: 'Teacher Operations',
    items: [
      { label: 'View teacher dashboard', scope: 'Teacher, Company' },
      { label: 'Edit lesson prep notes', scope: 'Teacher' },
      { label: 'Access training hub', scope: 'Teacher, Company' },
      { label: 'View teaching schedule', scope: 'Teacher, Company' },
    ],
  },
  {
    group: 'Student Experience',
    items: [
      { label: 'Open lesson library', scope: 'Student, Teacher' },
      { label: 'View last lesson video', scope: 'Student' },
      { label: 'Create practice plan', scope: 'Student' },
      { label: 'Message teacher', scope: 'Student' },
    ],
  },
  {
    group: 'Company & Billing',
    items: [
      { label: 'Manage teacher accounts', scope: 'Company' },
      { label: 'Review subscriptions', scope: 'Company' },
      { label: 'Update royalty settings', scope: 'Company' },
      { label: 'Publish announcements', scope: 'Company' },
    ],
  },
];

const companyAccounts = [
  {
    id: 'acct-01',
    name: 'Lena Ortiz',
    email: 'lena.ortiz@simplymusic.com',
    role: 'Company Admin',
    access: 'Full access',
    status: 'Active',
  },
  {
    id: 'acct-02',
    name: 'Miles Chen',
    email: 'miles.chen@simplymusic.com',
    role: 'Operations',
    access: 'Billing + Accounts',
    status: 'Active',
  },
  {
    id: 'acct-03',
    name: 'Priya Nair',
    email: 'priya.nair@simplymusic.com',
    role: 'Curriculum Lead',
    access: 'Curriculum + Lesson Library',
    status: 'Active',
  },
  {
    id: 'acct-04',
    name: 'Jordan Blake',
    email: 'jordan.blake@simplymusic.com',
    role: 'Support',
    access: 'Support + Messaging',
    status: 'Active',
  },
  {
    id: 'acct-05',
    name: 'Ava Patel',
    email: 'ava.patel@simplymusic.com',
    role: 'Marketing',
    access: 'Messaging + Promotions',
    status: 'Active',
  },
  {
    id: 'acct-06',
    name: 'Noah Kim',
    email: 'noah.kim@simplymusic.com',
    role: 'Analytics',
    access: 'Dashboards + Insights',
    status: 'Active',
  },
  {
    id: 'acct-07',
    name: 'Sofia Rossi',
    email: 'sofia.rossi@simplymusic.com',
    role: 'Finance',
    access: 'Royalties + Subscriptions',
    status: 'Active',
  },
];

export default function AccountPermissionsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Company
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Account Permissions
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Preview what each role can see and control across the platform.
          </p>
        </div>
        <Link
          href="/accounts"
          className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
        >
          Back to Accounts
        </Link>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Company Accounts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Individual Permission Profiles
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Fake accounts preview how access can be scoped per teammate.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Add Account
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--c-fcfcfb)] text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-ecebe7)]">
              {companyAccounts.map(account => (
                <tr key={account.id} className="bg-[var(--c-ffffff)]">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[var(--c-1f1f1d)]">
                      {account.name}
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      {account.email}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[var(--c-1f1f1d)]">
                    {account.role}
                  </td>
                  <td className="px-4 py-4 text-[var(--c-6f6c65)]">
                    {account.access}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {account.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                    >
                      Edit Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {roles.map(role => (
          <div
            key={role.title}
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Role
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              {role.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              {role.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--c-6f6c65)]">
              {role.badges.map(badge => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Permissions Matrix
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Access Snapshot
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Map workflows to the right role so teams stay focused and secure.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Drafted for review
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {permissions.map(group => (
            <div key={group.group} className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                {group.group}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {group.items.map(item => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                        Role access: {item.scope}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Audit Trail
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Recent Permission Changes
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Track adjustments before they go live in production.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Export Audit Log
          </button>
        </div>
        <div className="mt-6 space-y-3 text-sm text-[var(--c-6f6c65)]">
          <div className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
            <span>Company Admin access expanded to include Support dashboard</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Feb 4, 2026
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
            <span>Teacher role granted access to “This Week” schedule view</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Jan 28, 2026
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
            <span>Student role restricted from billing overview</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Jan 15, 2026
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
