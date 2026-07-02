import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AdminSidebar />
      <main className="ml-60 min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
