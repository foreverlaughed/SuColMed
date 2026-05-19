export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2026 宿院医约 · 高校校医院在线预约平台
          </p>
          <p className="text-sm text-slate-400">
            Powered by Next.js + Prisma
          </p>
        </div>
      </div>
    </footer>
  );
}
