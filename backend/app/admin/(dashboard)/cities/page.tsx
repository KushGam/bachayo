import { PageHeader } from '@/components/admin/StatCard';
import { fetchCityCoverage } from '@/lib/admin/cities';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 60;

export default async function AdminCitiesPage() {
  const supabase = createSupabaseAdmin();
  const rows = await fetchCityCoverage(supabase);

  const totals = rows.reduce(
    (acc, row) => ({
      cities: acc.cities + 1,
      partners: acc.partners + row.partners,
      customers: acc.customers + row.customers,
      bagsToday: acc.bagsToday + row.bagsToday,
      ordersToday: acc.ordersToday + row.ordersToday,
    }),
    { cities: 0, partners: 0, customers: 0, bagsToday: 0, ordersToday: 0 },
  );

  return (
    <>
      <PageHeader
        title="Cities"
        subtitle="Coverage across Nepal — every city with partners or customers"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Active cities', value: totals.cities },
          { label: 'Partners', value: totals.partners },
          { label: 'Customers', value: totals.customers },
          { label: 'Orders today', value: totals.ordersToday },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#F0EDE8] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#1A1A1A]">{stat.value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E8E4DE] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#1A1A1A]">No cities yet</p>
          <p className="mt-2 text-sm text-[#6B7280]">
            Cities appear here when partners or customers sign up in Nepal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <section
              key={row.id}
              className="rounded-xl border border-[#F0EDE8] bg-white p-6 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">{row.name}</h2>
                <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 font-mono text-[10px] text-[#9CA3AF]">
                  {row.id}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#9CA3AF]">Partners</dt>
                  <dd className="text-2xl font-semibold text-[#1A1A1A]">{row.partners}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Customers</dt>
                  <dd className="text-2xl font-semibold text-[#1A1A1A]">{row.customers}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Bags today</dt>
                  <dd className="text-2xl font-semibold text-[#D85A30]">{row.bagsToday}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Orders today</dt>
                  <dd className="text-2xl font-semibold text-[#1A1A1A]">{row.ordersToday}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
