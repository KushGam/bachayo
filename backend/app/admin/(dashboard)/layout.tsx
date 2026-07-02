import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] font-sans text-[#1A1A1A]">
      <AdminSidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="admin-main mx-auto min-h-screen max-w-[1200px] px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
