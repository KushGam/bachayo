'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Star,
  Users,
} from 'lucide-react';

import { AdminLogo } from '@/components/admin/AdminLogo';

const NAV_PRIMARY = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/partners', label: 'Partners', icon: Building2 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
] as const;

const NAV_OPS = [
  { href: '/admin/support', label: 'Support', icon: Inbox },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/cities', label: 'Cities', icon: MapPin },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}) {
  const pathname = usePathname();
  const active =
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        'relative mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
        active
          ? 'bg-[rgba(216,90,48,0.18)] font-semibold text-[#FFB089]'
          : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85',
      ].join(' ')}>
      {active ? (
        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#D85A30]" />
      ) : null}
      <Icon size={16} className={active ? 'text-[#D85A30]' : 'text-white/35'} strokeWidth={active ? 2.25 : 2} />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="rounded-full bg-[#D85A30] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminSidebar({ newSupportCount = 0 }: { newSupportCount?: number }) {
  const router = useRouter();

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-gradient-to-b from-[#1A1411] via-[#1A1A1A] to-[#14110F]">
      <div className="border-b border-white/[0.07] px-5 pb-5 pt-6">
        <AdminLogo />
        <p className="mt-2 text-[11px] font-medium tracking-wide text-white/35">Operations console</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
          Manage
        </p>
        {NAV_PRIMARY.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
          Operations
        </p>
        {NAV_OPS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            badge={item.href === '/admin/support' ? newSupportCount : undefined}
          />
        ))}
      </nav>

      <div className="border-t border-white/[0.07] px-3 py-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/40 transition-all duration-150 hover:bg-[rgba(226,75,74,0.1)] hover:text-[#E24B4A]">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
