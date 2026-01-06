import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { Link } from "react-router-dom";
import type {
  GetCalendarMarksResponse,
  GetDayDrawsResponse,
  ListDrawsResponse
} from "@shared/contracts/history.contract";
import { apiGet } from "@/lib/api";
import { Badge, Button, Card, Select } from "@/components/common/ui";

const WEEK_STARTS_ON = 1 as const; // ISO week (Mon)

export function HistoryPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const monthStart = useMemo(() => format(startOfMonth(month), "yyyy-MM-dd"), [month]);
  const monthEnd = useMemo(() => format(endOfMonth(month), "yyyy-MM-dd"), [month]);

  const marksQuery = useQuery({
    queryKey: ["history", "marks", monthStart, monthEnd],
    queryFn: () => apiGet<GetCalendarMarksResponse>(`/api/history/marks?start=${monthStart}&end=${monthEnd}`)
  });

  const dayQuery = useQuery({
    queryKey: ["history", "day", selectedDate],
    queryFn: () => apiGet<GetDayDrawsResponse>(`/api/history/day/${selectedDate}`)
  });

  const [rangeStart, setRangeStart] = useState(monthStart);
  const [rangeEnd, setRangeEnd] = useState(monthEnd);
  const [rangeCardCount, setRangeCardCount] = useState<"" | "1" | "2" | "3">("");

  const listQueryString = useMemo(() => {
    const sp = new URLSearchParams({ start: rangeStart, end: rangeEnd });
    if (rangeCardCount) sp.set("cardCount", rangeCardCount);
    return `?${sp.toString()}`;
  }, [rangeStart, rangeEnd, rangeCardCount]);

  const rangeQuery = useQuery({
    queryKey: ["history", "list", rangeStart, rangeEnd, rangeCardCount],
    queryFn: () => apiGet<ListDrawsResponse>(`/api/history${listQueryString}`)
  });

  const marksMap = useMemo(() => {
    const m = new Map<string, number>();
    marksQuery.data?.items.forEach((it) => m.set(it.date, it.count));
    return m;
  }, [marksQuery.data]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
    const days: Date[] = [];
    for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      days.push(d);
    }
    return days;
  }, [month]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card title="기록 달력" description="기록이 있는 날짜에 표시가 됩니다.">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            이전
          </Button>
          <div className="text-sm text-slate-200">{format(month, "yyyy년 MM월")}</div>
          <Button
            variant="ghost"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            다음
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
          {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {gridDays.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const inMonth = d.getMonth() === month.getMonth();
            const count = marksMap.get(dateStr) ?? 0;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={[
                  "rounded-lg border px-2 py-2 text-left",
                  inMonth
                    ? "border-slate-200/10 bg-slate-950/20 hover:border-indigo-400/20"
                    : "border-slate-200/5 bg-slate-950/10 opacity-60",
                  isSelected ? "ring-1 ring-indigo-400/40" : ""
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-200">{d.getDate()}</div>
                  {count > 0 ? <span className="h-2 w-2 rounded-full bg-indigo-400" /> : null}
                </div>
                {count > 1 ? <div className="mt-2 text-[11px] text-slate-400">{count}회</div> : null}
              </button>
            );
          })}
        </div>

        {marksQuery.isError ? <div className="mt-4 text-sm text-rose-300">{marksQuery.error.message}</div> : null}
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card title="선택 날짜" description={`${selectedDate}의 기록`}>
          {dayQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
          {dayQuery.isError ? <div className="text-sm text-rose-300">{dayQuery.error.message}</div> : null}
          {dayQuery.data && dayQuery.data.items.length === 0 ? (
            <div className="text-sm text-slate-300">이 날짜에는 기록이 없습니다.</div>
          ) : null}
          {dayQuery.data ? (
            <div className="space-y-3">
              {dayQuery.data.items.map((d) => (
                <Link
                  key={d.id}
                  to={`/history/${d.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/10 bg-slate-950/20 px-4 py-3 hover:border-indigo-400/20"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-slate-200">
                      {format(parseISO(d.drawnAt), "HH:mm")} · {d.cardCount}장
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

        <Card title="기간 검색" description="기간/장수로 기록을 조회합니다.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm text-slate-300">
              시작
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-300">
              종료
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <div>
              <div className="text-sm text-slate-300">장수</div>
              <div className="mt-1">
                <Select
                  value={rangeCardCount}
                  onChange={(v) => setRangeCardCount(v === "1" || v === "2" || v === "3" ? v : "")}
                  options={[
                    { value: "", label: "전체" },
                    { value: "1", label: "1장" },
                    { value: "2", label: "2장" },
                    { value: "3", label: "3장" }
                  ]}
                />
              </div>
            </div>
          </div>

          {rangeQuery.isLoading ? <div className="mt-4 text-sm text-slate-300">불러오는 중...</div> : null}
          {rangeQuery.isError ? <div className="mt-4 text-sm text-rose-300">{rangeQuery.error.message}</div> : null}
          {rangeQuery.data && rangeQuery.data.items.length === 0 ? (
            <div className="mt-4 text-sm text-slate-300">조건에 맞는 기록이 없습니다.</div>
          ) : null}
          {rangeQuery.data ? (
            <div className="mt-4 space-y-3">
              {rangeQuery.data.items.map((d) => (
                <Link
                  key={d.id}
                  to={`/history/${d.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/10 bg-slate-950/20 px-4 py-3 hover:border-indigo-400/20"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-slate-200">
                      {d.date} · {format(parseISO(d.drawnAt), "HH:mm")} · <Badge>{d.cardCount}장</Badge>
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
    </div>
  );
}



