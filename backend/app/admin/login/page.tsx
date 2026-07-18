import { AdminLogo } from '@/components/admin/AdminLogo';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith('/admin') ? params.next : '/admin';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d85a30] via-[#993c1d] to-[#3d1a0c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.18),transparent_50%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/25 backdrop-blur">
        <div className="mb-2 flex justify-center">
          <AdminLogo variant="light" />
        </div>
        <p className="mb-8 text-center text-sm text-[#6B7280]">Sign in to the operations console</p>
        <AdminLoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
