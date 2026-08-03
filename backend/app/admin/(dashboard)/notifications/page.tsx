import { NotificationComposer } from '@/components/admin/NotificationComposer';
import { PageHeader } from '@/components/admin/StatCard';
import { fetchActiveCityOptions } from '@/lib/admin/cities';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminNotificationsPage() {
  const supabase = createSupabaseAdmin();

  const [{ data: partners }, { data: customers }, { data: recentLog }, cities] =
    await Promise.all([
      supabase.from('partners').select('user_id, name').order('name'),
      supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'customer')
        .order('full_name', { ascending: true, nullsFirst: false }),
      supabase
        .from('admin_notification_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      fetchActiveCityOptions(supabase),
    ]);

  const partnerOptions = (partners ?? []).map((p) => ({ id: p.user_id, name: p.name }));
  const customerOptions = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.full_name?.trim() || c.phone || 'Unnamed customer',
    subtitle: c.phone,
  }));

  return (
    <>
      <PageHeader title="Notifications" subtitle="Send manual push notifications" />
      <NotificationComposer
        partners={partnerOptions}
        customers={customerOptions}
        cities={cities}
        recentLog={recentLog ?? []}
      />
    </>
  );
}
