export function formatNpr(amount: number) {
  return `Rs ${amount.toLocaleString('en-NP')}`;
}

export function formatRelativeDays(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/** Relative time for activity feed: just now / Xm ago / Xh ago / HH:MM */
export function formatActivityTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatClockTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function trialDaysLeft(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) return 0;
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function weekAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function cityLabel(cityId: string | null | undefined) {
  const map: Record<string, string> = {
    kathmandu: 'Kathmandu',
    lalitpur: 'Lalitpur',
    pokhara: 'Pokhara',
    bharatpur: 'Bhaktapur',
    bhaktapur: 'Bhaktapur',
  };
  if (!cityId) return '—';
  return map[cityId] ?? cityId;
}

export function tierLabel(tier: string | null | undefined) {
  if (!tier) return '—';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
