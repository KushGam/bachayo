export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-[#E8E4DE]" />
        <div className="h-4 w-64 rounded bg-[#E8E4DE]/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-[#F0EDE8] bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-[#F0EDE8] bg-white" />
    </div>
  );
}
