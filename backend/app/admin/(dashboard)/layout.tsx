import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getCachedNewSupportCount } from '@/lib/admin/cities';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  let newSupportCount = 0;
  try {
    newSupportCount = await getCachedNewSupportCount();
  } catch {
    newSupportCount = 0;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] font-sans text-[#1A1A1A]">
      <AdminSidebar newSupportCount={newSupportCount} />
      <main className="ml-[248px] min-h-screen">
        <div className="admin-main mx-auto max-w-[1200px] px-8 py-7 md:px-10 md:py-8">{children}</div>
      </main>
    </div>
  );
}
