'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Star,
  Users,
} from 'lucide-react';

import { AdminLogo } from '@/components/admin/AdminLogo';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/partners', label: 'Partners', icon: Building2 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/cities', label: 'Cities', icon: MapPin },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-[#1A1A1A]">
      <div className="border-b border-white/[0.08] px-5 pb-5 pt-6">
        <AdminLogo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'relative mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                active
                  ? 'bg-[rgba(216,90,48,0.15)] font-semibold text-[#D85A30]'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
              ].join(' ')}>
              {active ? (
                <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-sm bg-[#D85A30]" />
              ) : null}
              <Icon
                size={16}
                className={active ? 'text-[#D85A30]' : 'text-white/40'}
                strokeWidth={active ? 2.25 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.08] px-3 py-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/40 transition-all duration-150 hover:bg-[rgba(226,75,74,0.08)] hover:text-[#E24B4A]">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
