'use client';

import { useMemo, useState, useTransition } from 'react';

import { sendAdminNotification } from '@/app/admin/actions';
import type { AdminCityOption } from '@/lib/admin/cities';

type UserOption = { id: string; name: string; subtitle?: string | null };

export function NotificationComposer({
  partners,
  customers,
  cities,
  recentLog,
}: {
  partners: UserOption[];
  customers: UserOption[];
  cities: AdminCityOption[];
  recentLog: {
    id: string;
    target_type: string;
    target_label: string | null;
    title: string;
    body: string;
    recipients_count: number;
    created_at: string;
  }[];
}) {
  const [targetType, setTargetType] = useState('all');
  const [userKind, setUserKind] = useState<'partner' | 'customer'>('partner');
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const [userId, setUserId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const userOptions = userKind === 'partner' ? partners : customers;

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.subtitle?.toLowerCase().includes(q) ?? false),
    );
  }, [userOptions, userQuery]);

  const selectedUser = userOptions.find((u) => u.id === userId);

  const targetLabel =
    targetType === 'city'
      ? (cities.find((c) => c.id === cityId)?.name ?? cityId)
      : targetType === 'user'
        ? selectedUser
          ? `${userKind === 'partner' ? 'Partner' : 'Customer'}: ${selectedUser.name}`
          : userId
        : targetType;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Send notification</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setUserId('');
                setUserQuery('');
                setResult(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">All users</option>
              <option value="partners">All partners</option>
              <option value="customers">All customers</option>
              <option value="city">Specific city</option>
              <option value="user">Specific user</option>
            </select>
          </div>
          {targetType === 'city' ? (
            cities.length === 0 ? (
              <p className="text-sm text-gray-500">No cities with users yet.</p>
            ) : (
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            )
          ) : null}
          {targetType === 'user' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserKind('partner');
                    setUserId('');
                    setUserQuery('');
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                    userKind === 'partner'
                      ? 'bg-[#D85A30] text-white'
                      : 'border border-gray-300 bg-white text-gray-700'
                  }`}>
                  Partner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserKind('customer');
                    setUserId('');
                    setUserQuery('');
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                    userKind === 'customer'
                      ? 'bg-[#D85A30] text-white'
                      : 'border border-gray-300 bg-white text-gray-700'
                  }`}>
                  Customer
                </button>
              </div>
              <input
                type="search"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={
                  userKind === 'partner'
                    ? 'Search partners…'
                    : 'Search customers by name or phone…'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">
                  {userKind === 'partner' ? 'Select partner…' : 'Select customer…'}
                </option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.subtitle ? `${u.name} · ${u.subtitle}` : u.name}
                  </option>
                ))}
              </select>
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No matches.</p>
              ) : null}
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title (max 50)</label>
            <input
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Body (max 150)</label>
            <textarea
              maxLength={150}
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {result ? <p className="text-sm text-green-700">{result}</p> : null}
          <button
            type="button"
            disabled={
              pending ||
              !title ||
              !body ||
              (targetType === 'city' && !cityId) ||
              (targetType === 'user' && !userId)
            }
            onClick={() =>
              start(async () => {
                const res = await sendAdminNotification({
                  targetType,
                  targetLabel,
                  title,
                  body,
                  cityId: targetType === 'city' ? cityId : undefined,
                  userId: targetType === 'user' ? userId : undefined,
                });
                setResult(`Sent to ${res.sent} of ${res.total} users.`);
              })
            }
            className="rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#993C1D] disabled:opacity-60">
            {pending ? 'Sending…' : 'Send notification'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Preview</h2>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mx-auto max-w-xs rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">LASTBAG</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{title || 'Notification title'}</p>
            <p className="mt-1 text-sm text-gray-600">{body || 'Notification body preview…'}</p>
          </div>
        </div>
      </section>

      <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Recent sends</h2>
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Target</th>
              <th className="py-2 text-left">Title</th>
              <th className="py-2 text-right">Recipients</th>
            </tr>
          </thead>
          <tbody>
            {recentLog.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                <td className="py-2">{row.target_label ?? row.target_type}</td>
                <td className="py-2">{row.title}</td>
                <td className="py-2 text-right">{row.recipients_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
