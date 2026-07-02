import Link from 'next/link';

import { ReviewRemoveButton } from '@/components/admin/ReviewRemoveButton';
import { PageHeader } from '@/components/admin/StatCard';
import { isReviewFlagged } from '@/lib/moderation';
import { formatRelativeDays } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();

  let query = supabase
    .from('reviews')
    .select('*, partner:partners(name), customer:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.filter === '1') query = query.eq('rating', 1);
  if (params.filter === '2') query = query.eq('rating', 2);

  const { data: reviews } = await query;

  const filtered = (reviews ?? []).filter((r) => {
    if (params.filter === 'flagged') return isReviewFlagged(r.rating, r.comment);
    return true;
  });

  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate partner reviews" />

      <div className="mb-4 flex gap-2">
        {[
          { key: '', label: 'All' },
          { key: '1', label: '1 star' },
          { key: '2', label: '2 star' },
          { key: 'flagged', label: 'Flagged' },
        ].map((f) => (
          <Link
            key={f.key || 'all'}
            href={f.key ? `/admin/reviews?filter=${f.key}` : '/admin/reviews'}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              (params.filter ?? '') === f.key ? 'bg-[#FAECE7] text-[#D85A30]' : 'bg-white border border-gray-300 text-gray-700',
            ].join(' ')}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">Comment</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const partner = Array.isArray(r.partner) ? r.partner[0] : r.partner;
              const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer;
              const flagged = isReviewFlagged(r.rating, r.comment);
              return (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{partner?.name ?? '—'}</td>
                  <td className="px-4 py-3">{customer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    ★ {r.rating}
                    {flagged ? <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">Flagged</span> : null}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">{r.comment ?? '—'}</td>
                  <td className="px-4 py-3">{formatRelativeDays(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <ReviewRemoveButton reviewId={r.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
