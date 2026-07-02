import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CustomerActions } from '@/components/admin/CustomerActions';
import { PageHeader } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { cityLabel, formatDateTime, formatNpr } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!profile) notFound();

  const [{ data: orders }, { data: reviews }, { data: authUser }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_price, status, quantity, created_at, partner:partners(name), bag:rescue_bags(title)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, partner:partners(name)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase.auth.admin.getUserById(id),
  ]);

  return (
    <>
      <Link href="/admin/customers" className="text-sm font-medium text-[#D85A30] hover:underline">
        ← Back to customers
      </Link>
      <PageHeader title={profile.full_name ?? 'Customer'} subtitle={cityLabel(profile.city_id)} />
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 text-sm">
        <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div><span className="text-gray-500">Phone:</span> {profile.phone ?? '—'}</div>
          <div><span className="text-gray-500">Email:</span> {authUser?.user?.email ?? '—'}</div>
          <div><span className="text-gray-500">Joined:</span> {formatDateTime(profile.created_at)}</div>
          <div><span className="text-gray-500">Suspended:</span> {profile.is_suspended ? 'Yes' : 'No'}</div>
        </dl>
        <div className="mt-4">
          <CustomerActions profileId={id} />
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Order history</h2>
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Partner</th>
              <th className="py-2 text-left">Bag</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const partner = Array.isArray(o.partner) ? o.partner[0] : o.partner;
              const bag = Array.isArray(o.bag) ? o.bag[0] : o.bag;
              return (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="py-2">{formatDateTime(o.created_at)}</td>
                  <td className="py-2">{partner?.name ?? '—'}</td>
                  <td className="py-2">{bag?.title ?? '—'}</td>
                  <td className="py-2">{formatNpr(o.total_price / 100)}</td>
                  <td className="py-2"><StatusBadge status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Reviews left</h2>
        <ul className="space-y-3 text-sm">
          {(reviews ?? []).map((r) => {
            const partner = Array.isArray(r.partner) ? r.partner[0] : r.partner;
            return (
              <li key={r.id} className="rounded-lg border border-gray-100 p-3">
                <div className="font-medium">★ {r.rating} · {partner?.name ?? 'Partner'}</div>
                {r.comment ? <p className="mt-1 text-gray-600">{r.comment}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
