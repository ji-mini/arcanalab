import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { GetRecentDrawsResponse } from "@shared/contracts/history.contract";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/common/ui";
import { format, parseISO } from "date-fns";
import { getCardThumbnailSrc } from "@/lib/card-image";

export function HomePage() {
  const recentQuery = useQuery({
    queryKey: ["history", "recent", 3],
    queryFn: () => apiGet<GetRecentDrawsResponse>(`/history/recent?limit=3`)
  });

  return (
    <div className="space-y-6">
      {/* hero layout: left CTA / center visual / right recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-amber-200/15 bg-slate-950/20 p-5 backdrop-blur">
            <div className="text-xs tracking-[0.28em] text-amber-100/80">MAIN ACTIONS</div>
            <div className="mt-3 space-y-3">
              <CtaLink
                to="/cards"
                title="카드 설명 보기"
                description="78장 카드 목록과 상세 설명"
              />
              <CtaLink
                to="/draw"
                title="오늘의 카드 뽑기"
                description="1~3장 · 정/역 · GPT 리딩"
              />
              <CtaLink
                to="/history"
                title="기록(달력) 보기"
                description="날짜별로 기록 다시 읽기"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-xl border border-slate-200/10 bg-slate-950/15 p-6 backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_500px_at_50%_20%,rgba(245,158,11,0.10),transparent_60%)]" />
            <div className="relative text-center">
              <div className="text-xs tracking-[0.34em] text-amber-100/70">Tarot Academy: Arcana Lab</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">상징을 수집하고, 의미를 정리합니다.</div>
              <div className="mt-2 text-sm text-slate-300">
                과장 없이, 차분하게. 오늘의 흐름을 한 줄로 남겨보세요.
              </div>
            </div>

            <div className="relative mt-8 flex items-center justify-center">
              <img
                src="/mystic-tree.svg"
                alt="mystic tree"
                className="h-[340px] w-[340px] opacity-90"
                loading="lazy"
              />

              {/* floating cards */}
              <FloatingCard className="-left-2 top-8 rotate-[-10deg]" />
              <FloatingCard className="left-10 bottom-8 rotate-[8deg]" />
              <FloatingCard className="right-10 bottom-10 rotate-[-6deg]" />
              <FloatingCard className="-right-2 top-10 rotate-[12deg]" />
              <FloatingCard className="left-1/2 top-2 -translate-x-1/2 rotate-[0deg]" small />
            </div>

            <div className="relative mt-6 text-center text-sm text-slate-300">
              Unlock ancient wisdom. Explore the mysteries of the day.
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card
            title="최근 기록"
            description="최근 3개의 뽑기 미리보기"
            action={
              <Link to="/history" className="text-sm text-amber-100/80 hover:text-amber-100">
                더보기
              </Link>
            }
          >
            {recentQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
            {recentQuery.isError ? <div className="text-sm text-rose-300">{recentQuery.error.message}</div> : null}
            {recentQuery.data && recentQuery.data.items.length === 0 ? (
              <div className="text-sm text-slate-300">아직 기록이 없습니다. 오늘의 카드를 뽑아보세요.</div>
            ) : null}
            {recentQuery.data ? (
              <div className="space-y-3">
                {recentQuery.data.items.map((d) => (
                  <Link
                    key={d.id}
                    to={`/history/${d.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/10 bg-slate-950/20 px-4 py-3 hover:border-amber-200/20"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-200">
                        {d.date} · {format(parseISO(d.drawnAt), "HH:mm")}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-400">
                        {d.summaryOneLine ?? `${d.cardCount}장 기록`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {d.items.slice(0, 3).map((it) => (
                        <img
                          key={it.id}
                          src={getCardThumbnailSrc(it.card)}
                          alt={it.card.nameKo}
                          className={[
                            "h-10 w-7 rounded border border-slate-200/10 object-cover origin-center transform-gpu transition-transform duration-200",
                            it.orientation === "REVERSED" ? "rotate-180" : ""
                          ].join(" ")}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CtaLink(props: { to: string; title: string; description: string }) {
  return (
    <Link
      to={props.to}
      className={[
        "block rounded-lg border border-amber-200/15 bg-slate-950/15 px-4 py-3",
        "hover:border-amber-200/25 hover:bg-slate-950/25"
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-slate-50">{props.title}</div>
      <div className="mt-1 text-xs text-slate-400">{props.description}</div>
    </Link>
  );
}

function FloatingCard(props: { className: string; small?: boolean }) {
  const sizeClass = props.small ? "h-16 w-12" : "h-24 w-16";
  return (
    <div className={["pointer-events-none absolute", props.className].join(" ")}>
      <div
        className={[
          sizeClass,
          "rounded-md border border-amber-200/20 bg-slate-950/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur"
        ].join(" ")}
      >
        <img src="/card-back.svg" alt="" className="h-full w-full rounded-md object-cover opacity-90" />
      </div>
    </div>
  );
}



