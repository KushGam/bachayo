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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <AdminLogo variant="light" />
        </div>
        <AdminLoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
