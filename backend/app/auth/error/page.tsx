import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EF] px-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Sign-in failed</h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          We couldn&apos;t complete Google Sign-In. Please try again or use the LastBag mobile app.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#D85A30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#993C1D]">
          Back to home
        </Link>
      </div>
    </main>
  );
}
