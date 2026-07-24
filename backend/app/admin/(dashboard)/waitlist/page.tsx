import { PageHeader, StatCard } from '@/components/admin/StatCard';
import {
  WaitlistLaunchPanel,
  WaitlistRowActions,
} from '@/components/admin/WaitlistAdminPanel';
import { formatActivityTime, formatDate, todayIso, weekAgoIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();
  const today = todayIso();
  const weekAgo = weekAgoIso();

  let query = supabase
    .from('waitlist')
    .select('id, email, city, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (params.q?.trim()) {
    query = query.ilike('email', `%${params.q.trim()}%`);
  }

  const [
    { count: total },
    { count: thisWeek },
    { count: todayCount },
    { data: rows },
    { count: pushUsers },
  ] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`),
    query,
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('push_token', 'is', null),
  ]);

  return (
    <>
      <PageHeader title="Waitlist" subtitle="People who want LastBag near them" />

      <WaitlistLaunchPanel
        subscriberCount={total ?? 0}
        pushUserCount={pushUsers ?? 0}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total signups" value={total ?? 0} />
        <StatCard title="This week" value={thisWeek ?? 0} />
        <StatCard title="Today" value={todayCount ?? 0} />
      </div>

      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by email…"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#D85A30]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[#D85A30] px-4 py-3 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Signed up</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                  No waitlist signups yet
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                  <td className="px-4 py-3 text-gray-500" title={formatDate(row.created_at)}>
                    {formatActivityTime(row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <WaitlistRowActions row={row} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
