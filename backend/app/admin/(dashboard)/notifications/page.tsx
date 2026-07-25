import { NotificationComposer } from '@/components/admin/NotificationComposer';
import { PageHeader } from '@/components/admin/StatCard';
import { fetchActiveCityOptions } from '@/lib/admin/cities';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminNotificationsPage() {
  const supabase = createSupabaseAdmin();

  const [{ data: partners }, { data: recentLog }, cities] = await Promise.all([
    supabase.from('partners').select('user_id, name').order('name'),
    supabase
      .from('admin_notification_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
    fetchActiveCityOptions(supabase),
  ]);

  const partnerOptions = (partners ?? []).map((p) => ({ id: p.user_id, name: p.name }));

  return (
    <>
      <PageHeader title="Notifications" subtitle="Send manual push notifications" />
      <NotificationComposer
        partners={partnerOptions}
        cities={cities}
        recentLog={recentLog ?? []}
      />
    </>
  );
}
