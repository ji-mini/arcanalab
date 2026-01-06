import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "홈" },
  { to: "/cards", label: "카드" },
  { to: "/draw", label: "뽑기" },
  { to: "/history", label: "기록" }
] as const;

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* background layers */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-[#070B1A] to-slate-950" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_700px_at_50%_-10%,rgba(37,99,235,0.18),transparent_60%),radial-gradient(900px_600px_at_20%_20%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_600px_at_80%_25%,rgba(245,158,11,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:url('/constellation.svg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/30" />

      <header className="relative border-b border-slate-200/10 bg-slate-950/10 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-xs tracking-[0.34em] text-amber-100/80">
              Tarot Academy
            </Link>
            <div className="hidden text-xs text-slate-300 md:block">연구 · 기록 · 리딩</div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <Link to="/" className="flex items-baseline gap-3">
              <span className="text-lg font-semibold tracking-[0.22em] text-slate-50">ARCANA-LAB</span>
              <span className="hidden text-sm text-slate-300 md:inline">타로카드 연구소</span>
            </Link>
            <nav className="flex items-center gap-4">
              {navItems.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    [
                      "text-xs tracking-[0.24em]",
                      isActive ? "text-amber-100" : "text-slate-300 hover:text-slate-100"
                    ].join(" ")
                  }
                  end={it.to === "/"}
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="relative border-t border-slate-200/10 bg-slate-950/10 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400">
          ARCANA-LAB · local-first · 기록은 언제든 다시 열람할 수 있습니다.
        </div>
      </footer>
    </div>
  );
}



