'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PartnerAccountActions } from '@/components/admin/PartnerAccountActions';
import { ApprovalBadge, CategoryBadge, StatusBadge } from '@/components/admin/StatusBadge';
import { cityLabel, formatRelativeDays, tierLabel, trialDaysLeft } from '@/lib/admin/format';

export type PartnerRow = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  city_id: string | null;
  area_id: string | null;
  phone: string | null;
  created_at: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  approval_status: string;
  owner_name: string | null;
  owner_phone: string | null;
  bags_today: number;
  last_bag_at: string | null;
};

function statusLabel(partner: PartnerRow) {
  const status = partner.subscription_status ?? 'trial';
  if (status === 'trial') {
    const days = trialDaysLeft(partner.trial_ends_at);
    return `Trial (${days}d left)`;
  }
  return status.replace('_', ' ');
}

export function PartnersFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`/admin/partners?${next.toString()}`);
  }

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#D85A30]';

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <input
        type="search"
        placeholder="Search name or phone…"
        defaultValue={params.get('q') ?? ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value);
        }}
        className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <select className={selectClass} defaultValue={params.get('city') ?? ''} onChange={(e) => update('city', e.target.value)}>
        <option value="">All cities</option>
        <option value="kathmandu">Kathmandu</option>
        <option value="lalitpur">Lalitpur</option>
        <option value="pokhara">Pokhara</option>
        <option value="bhaktapur">Bhaktapur</option>
      </select>
      <select className={selectClass} defaultValue={params.get('category') ?? ''} onChange={(e) => update('category', e.target.value)}>
        <option value="">All categories</option>
        <option value="restaurant">Restaurant</option>
        <option value="cafe">Cafe</option>
        <option value="bakery">Bakery</option>
        <option value="mart">Mart</option>
        <option value="hotel">Hotel</option>
      </select>
      <select className={selectClass} defaultValue={params.get('status') ?? ''} onChange={(e) => update('status', e.target.value)}>
        <option value="">All statuses</option>
        <option value="trial">Trial</option>
        <option value="active">Active</option>
        <option value="past_due">Past Due</option>
        <option value="paused">Paused</option>
      </select>
      <select className={selectClass} defaultValue={params.get('tier') ?? ''} onChange={(e) => update('tier', e.target.value)}>
        <option value="">All tiers</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
      <a
        href={`/api/admin/export/partners?${params.toString()}`}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Export CSV
      </a>
    </div>
  );
}

export function PartnersTable({ partners }: { partners: PartnerRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Signed up</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-left">Subscription</th>
              <th className="px-4 py-3 text-left">Last active</th>
              <th className="px-4 py-3 text-right">Bags today</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <CategoryBadge label={p.categoryLabel} category={p.category} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{p.owner_name ?? '—'}</div>
                  <div className="text-xs text-gray-500">{p.owner_phone ?? p.phone ?? '—'}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {cityLabel(p.city_id)}
                  {p.area_id ? <span className="text-gray-500"> · {p.area_id}</span> : null}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatRelativeDays(p.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {tierLabel(p.subscription_tier)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ApprovalBadge status={p.approval_status} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.subscription_status ?? 'trial'} label={statusLabel(p)} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {p.last_bag_at ? formatRelativeDays(p.last_bag_at) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium">{p.bags_today}</td>
                <td className="px-4 py-3 text-right">
                  <PartnerAccountActions partnerId={p.id} approvalStatus={p.approval_status} variant="menu" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  function href(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(p));
    return `/admin/partners?${next.toString()}`;
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-white">
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={href(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-white">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
