'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { AdminLogo } from '@/components/admin/AdminLogo';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '▦' },
  { href: '/admin/partners', label: 'Partners', icon: '⌂' },
  { href: '/admin/billing', label: 'Billing', icon: '¤' },
  { href: '/admin/customers', label: 'Customers', icon: '◎' },
  { href: '/admin/cities', label: 'Cities', icon: '⌖' },
  { href: '/admin/reviews', label: 'Reviews', icon: '★' },
  { href: '/admin/notifications', label: 'Notifications', icon: '◉' },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <AdminLogo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-l-[3px] border-[#D85A30] bg-[#FAECE7] pl-[9px] text-[#D85A30]'
                  : 'border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')}>
              <span className="w-4 text-center text-xs opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          Sign out
        </button>
      </div>
    </aside>
  );
}
