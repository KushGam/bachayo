'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type WaitlistRow = {
  id: string;
  email: string;
  city: string | null;
  created_at: string;
};

export function WaitlistLaunchPanel({
  subscriberCount,
  pushUserCount,
}: {
  subscriberCount: number;
  pushUserCount: number;
}) {
  const [launchOpen, setLaunchOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pushTitle, setPushTitle] = useState('LastBag is live! 🎉');
  const [pushBody, setPushBody] = useState(
    'Rescue bags are now available in Kathmandu. Find your first bag now!',
  );

  async function sendLaunchEmail() {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/send-launch-email', { method: 'POST' });
      const data = (await response.json()) as {
        success?: boolean;
        sent?: number;
        failed?: number;
        total?: number;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send');
      }
      setResult(`Sent to ${data.sent}/${data.total} subscribers${data.failed ? ` (${data.failed} failed)` : ''}.`);
      setLaunchOpen(false);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed to send launch email');
    } finally {
      setSending(false);
    }
  }

  async function sendPush() {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/broadcast-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          type: 'announcement',
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        sent?: number;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send push');
      }
      setResult(`Push sent to ${data.sent} users.`);
      setPushOpen(false);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed to send push');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setLaunchOpen(true)}
          className="rounded-xl bg-[#D85A30] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(216,90,48,0.25)] transition hover:bg-[#993C1D]">
          🚀 Send launch announcement to all {subscriberCount} subscribers
        </button>
        <button
          type="button"
          onClick={() => setPushOpen(true)}
          className="rounded-xl border border-[#D85A30]/30 bg-white px-5 py-3 text-sm font-semibold text-[#D85A30] transition hover:bg-[#FAECE7]">
          📱 Send push notification
        </button>
        <a
          href="/api/admin/export/waitlist"
          className="rounded-xl border border-[#E8E4DE] bg-white px-5 py-3 text-sm font-semibold text-[#D85A30] transition hover:border-[#D85A30]/40">
          Export CSV →
        </a>
      </div>

      {result ? <p className="text-sm font-medium text-[#065F46]">{result}</p> : null}

      {launchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1A1A1A]">Send launch announcement</h3>
            <p className="mt-1 text-sm text-gray-500">
              Subject: LastBag is live in Kathmandu! 🎉🛍
            </p>

            <div className="mt-4 rounded-xl border border-[#F0EDE8] bg-[#FAFAF8] p-4 text-sm text-gray-700">
              <p className="font-semibold text-[#1A1A1A]">LastBag is live!</p>
              <p className="mt-2">
                Rescue bags are now live in Kathmandu. You signed up to be notified — and today is
                that day!
              </p>
              <p className="mt-3 text-xs text-gray-400">Preview of the email that will be sent.</p>
            </div>

            <p className="mt-4 text-sm font-medium text-[#92400E]">
              This will send to {subscriberCount} people. This cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setLaunchOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button
                type="button"
                disabled={sending || subscriberCount === 0}
                onClick={() => void sendLaunchEmail()}
                className="rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {sending ? 'Sending…' : `Send to ${subscriberCount} people →`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pushOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1A1A1A]">Send push notification</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sends to all app users with a push token ({pushUserCount}).
            </p>

            <label className="mt-4 block text-sm font-medium text-gray-700">Title</label>
            <input
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              maxLength={50}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <label className="mt-3 block text-sm font-medium text-gray-700">Body</label>
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setPushOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button
                type="button"
                disabled={sending || !pushTitle.trim() || !pushBody.trim()}
                onClick={() => void sendPush()}
                className="rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {sending ? 'Sending…' : `Send to all ${pushUserCount} users →`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WaitlistRowActions({ row }: { row: WaitlistRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        <a
          href={`mailto:${row.email}`}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          📧 Email
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Remove ${row.email} from the waitlist?`)) return;
            start(async () => {
              setError(null);
              try {
                const response = await fetch('/api/admin/waitlist/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ id: row.id }),
                });
                const data = (await response.json().catch(() => ({}))) as {
                  success?: boolean;
                  error?: string;
                };
                if (!response.ok || !data.success) {
                  throw new Error(data.error ?? `Request failed (${response.status})`);
                }
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Remove failed');
              }
            });
          }}
          className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">
          {pending ? '…' : '🗑 Remove'}
        </button>
      </div>
      {error ? <p className="max-w-[12rem] text-right text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
