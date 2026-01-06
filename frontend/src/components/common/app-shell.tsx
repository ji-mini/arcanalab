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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_500px_at_80%_30%,rgba(168,85,247,0.10),transparent_60%)]" />

      <header className="relative border-b border-slate-800/70 bg-slate-950/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-[0.18em]">ARCANA-LAB</span>
            <span className="hidden text-sm text-slate-300 md:inline">타로카드 연구와 기록을 위한 작은 연구소</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-2 text-sm",
                    isActive
                      ? "bg-indigo-500/15 text-slate-50 ring-1 ring-indigo-400/20"
                      : "text-slate-300 hover:bg-slate-950/40 hover:text-slate-50"
                  ].join(" ")
                }
                end={it.to === "/"}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="relative border-t border-slate-800/70 bg-slate-950/10 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400">
          ARCANA-LAB · local-first · 기록은 언제든 다시 열람할 수 있습니다.
        </div>
      </footer>
    </div>
  );
}



