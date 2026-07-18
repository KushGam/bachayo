import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  let newSupportCount = 0;
  try {
    const supabase = createSupabaseAdmin();
    const { count } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    newSupportCount = count ?? 0;
  } catch {
    newSupportCount = 0;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] font-sans text-[#1A1A1A]">
      <AdminSidebar newSupportCount={newSupportCount} />
      <main className="ml-[248px] min-h-screen">
        <div className="border-b border-[#E8E4DE]/80 bg-[#FFFCFA]/80 px-10 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-[#9C9590]">LastBag Admin</p>
        </div>
        <div className="admin-main mx-auto max-w-[1200px] px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
