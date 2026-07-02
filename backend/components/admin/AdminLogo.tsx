export function AdminLogo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl bg-[#D85A30] text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.45 }}>
        B
      </div>
      <div>
        <div className="text-base font-semibold text-gray-900 leading-tight">Bachayo</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Admin</div>
      </div>
    </div>
  );
}
