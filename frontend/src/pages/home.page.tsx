import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { GetRecentDrawsResponse } from "@shared/contracts/history.contract";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/common/ui";
import { format, parseISO } from "date-fns";

export function HomePage() {
  const recentQuery = useQuery({
    queryKey: ["history", "recent", 3],
    queryFn: () => apiGet<GetRecentDrawsResponse>(`/api/history/recent?limit=3`)
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-slate-200/10 bg-slate-950/20 p-6 shadow-[0_0_0_1px_rgba(168,85,247,0.08)] backdrop-blur">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative">
          <div className="text-xs tracking-[0.24em] text-slate-300">ARCANA-LAB</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">오늘의 상징을 기록하고, 해석을 축적합니다.</div>
          <div className="mt-2 text-sm text-slate-200">
            카드를 살펴보고, 한 번 뽑고, 차분히 기록을 모아보세요.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/cards" className="block">
          <Card title="카드 설명 보기" description="78장 카드 목록과 상세 설명을 탐색합니다." />
        </Link>
        <Link to="/draw" className="block">
          <Card title="오늘의 카드 뽑기" description="1~3장을 뽑고 GPT 리딩을 생성합니다." />
        </Link>
        <Link to="/history" className="block">
          <Card title="기록(달력) 보기" description="날짜별로 누적된 기록을 다시 읽습니다." />
        </Link>
      </div>

      <Card
        title="최근 기록"
        description="최근 3개의 뽑기 기록 미리보기"
        action={
          <Link to="/history" className="text-sm text-indigo-200 hover:text-indigo-100">
            더보기
          </Link>
        }
      >
        {recentQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
        {recentQuery.isError ? (
          <div className="text-sm text-rose-300">{recentQuery.error.message}</div>
        ) : null}
        {recentQuery.data && recentQuery.data.items.length === 0 ? (
          <div className="text-sm text-slate-300">아직 기록이 없습니다. 오늘의 카드를 뽑아보세요.</div>
        ) : null}
        {recentQuery.data ? (
          <div className="space-y-3">
            {recentQuery.data.items.map((d) => (
              <Link
                key={d.id}
                to={`/history/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/10 bg-slate-950/20 px-4 py-3 hover:border-indigo-400/20"
              >
                <div className="min-w-0">
                  <div className="text-sm text-slate-200">
                    {d.date} · {format(parseISO(d.drawnAt), "HH:mm")} · {d.cardCount}장
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-400">
                    {d.summaryOneLine ?? "요약이 준비되면 여기에 표시됩니다."}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.items.slice(0, 3).map((it) => (
                    <img
                      key={it.id}
                      src={it.card.thumbnailUrl ?? "/card-back.svg"}
                      alt={it.card.nameKo}
                      className="h-10 w-7 rounded border border-slate-200/10 object-cover"
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
  );
}



