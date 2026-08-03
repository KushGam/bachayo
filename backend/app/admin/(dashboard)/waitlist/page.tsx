import { PageHeader, StatCard } from '@/components/admin/StatCard';
import {
  WaitlistLaunchPanel,
  WaitlistRowActions,
} from '@/components/admin/WaitlistAdminPanel';
import { formatActivityTime, formatDate, todayIso, weekAgoIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { WAITLIST_CITIES, WAITLIST_PRIMARY_CITIES } from '@/lib/waitlist-cities';

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();
  const today = todayIso();
  const weekAgo = weekAgoIso();
  const cityFilter =
    params.city && params.city !== 'all' && WAITLIST_CITIES.includes(params.city as never)
      ? params.city
      : null;

  let query = supabase
    .from('waitlist')
    .select('id, email, city, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (params.q?.trim()) {
    query = query.ilike('email', `%${params.q.trim()}%`);
  }
  if (cityFilter === 'Other') {
    query = query.or(
      `city.is.null,city.eq.Other,city.not.in.(${WAITLIST_PRIMARY_CITIES.join(',')})`,
    );
  } else if (cityFilter) {
    query = query.eq('city', cityFilter);
  }

  const [
    { count: total },
    { count: thisWeek },
    { count: todayCount },
    { data: rows },
    { count: pushUsers },
    { data: cityRows },
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
    supabase.from('waitlist').select('city'),
  ]);

  const cityCounts = Object.fromEntries(WAITLIST_CITIES.map((c) => [c, 0])) as Record<
    string,
    number
  >;
  const customCityCounts = new Map<string, number>();
  for (const row of cityRows ?? []) {
    const c = row.city;
    if (c && WAITLIST_PRIMARY_CITIES.includes(c as (typeof WAITLIST_PRIMARY_CITIES)[number])) {
      cityCounts[c] += 1;
    } else {
      cityCounts.Other += 1;
      const label = c?.trim() || 'Unknown';
      if (label !== 'Other') {
        customCityCounts.set(label, (customCityCounts.get(label) ?? 0) + 1);
      }
    }
  }

  const topOtherCities = [...customCityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const filteredCount = cityFilter ? (cityCounts[cityFilter] ?? 0) : (total ?? 0);

  return (
    <>
      <PageHeader title="Waitlist" subtitle="People who want LastBag near them" />

      <WaitlistLaunchPanel
        subscriberCount={total ?? 0}
        pushUserCount={pushUsers ?? 0}
        cityCounts={cityCounts}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total signups" value={total ?? 0} />
        <StatCard title="This week" value={thisWeek ?? 0} />
        <StatCard title="Today" value={todayCount ?? 0} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {WAITLIST_CITIES.map((city) => (
          <div
            key={city}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{city}</p>
            <p className="mt-0.5 text-gray-500">{cityCounts[city]} signups</p>
          </div>
        ))}
      </div>

      {topOtherCities.length > 0 ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Other cities (demand)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topOtherCities.map(([name, count]) => (
              <span
                key={name}
                className="rounded-full bg-[#FAECE7] px-3 py-1 text-sm font-medium text-[#993C1D]">
                {name}: {count}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by email…"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#D85A30]"
        />
        <select
          name="city"
          defaultValue={params.city ?? 'all'}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#D85A30]">
          <option value="all">All cities</option>
          {WAITLIST_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[#D85A30] px-4 py-3 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  No waitlist signups yet
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                  <td className="px-4 py-3 text-gray-600">{row.city ?? '—'}</td>
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

      {cityFilter ? (
        <p className="mt-3 text-sm text-gray-500">
          Showing {rows?.length ?? 0} of {filteredCount} in {cityFilter}
        </p>
      ) : null}
    </>
  );
}
