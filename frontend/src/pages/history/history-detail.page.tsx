import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { GetDrawDetailResponse } from "@shared/contracts/history.contract";
import type { DrawItemDto } from "@shared/contracts/draw.contract";
import { apiGet } from "@/lib/api";
import { Badge, Button, Card } from "@/components/common/ui";
import { format, parseISO } from "date-fns";
import { getCardThumbnailSrc } from "@/lib/card-image";

export function HistoryDetailPage() {
  const { drawId } = useParams();

  const detailQuery = useQuery({
    queryKey: ["history", "detail", drawId],
    enabled: Boolean(drawId),
    queryFn: () => apiGet<GetDrawDetailResponse>(`/history/${drawId}`)
  });

  if (!drawId) {
    return (
      <Card title="기록 상세" description="잘못된 접근입니다.">
        <Link to="/history" className="text-sm text-amber-100/80 hover:text-amber-100">
          달력으로
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">기록 상세</div>
          <div className="text-xl font-semibold text-slate-50">한 번의 뽑기와 리딩을 다시 읽습니다.</div>
        </div>
        <Link to="/history">
          <Button variant="secondary">달력</Button>
        </Link>
      </div>

      {detailQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
      {detailQuery.isError ? <div className="text-sm text-rose-300">{detailQuery.error.message}</div> : null}
      {detailQuery.data ? <DetailContent data={detailQuery.data} /> : null}
    </div>
  );
}

function DetailContent(props: { data: GetDrawDetailResponse }) {
  const d = props.data.item;
  return (
    <Card title={`${d.date}의 기록`} description={`${format(parseISO(d.drawnAt), "HH:mm")} · ${d.cardCount}장`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="text-sm font-semibold text-slate-50">뽑은 카드</div>
          <div className="mt-3 space-y-3">
            {d.items.map((it) => (
              <HistoryCardItem key={it.id} item={it} />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-semibold text-slate-50">리딩 본문</div>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{d.readingText}</pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>prompt v{d.promptVersion}</Badge>
            {d.model ? <Badge>{d.model}</Badge> : <Badge>model: (disabled)</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryCardItem(props: { item: DrawItemDto }) {
  const it = props.item;
  const directionKo = it.orientation === "UPRIGHT" ? "정방향" : "역방향";
  const isReversed = it.orientation === "REVERSED";
  const isMajor = it.card.arcana === "MAJOR";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200/10 bg-slate-950/20 px-3 py-3 backdrop-blur">
      <img
        src={getCardThumbnailSrc(it.card)}
        alt={it.card.nameKo}
        className={[
          "h-14 w-10 rounded border object-cover origin-center transform-gpu transition-transform duration-200",
          isMajor ? "border-amber-200/45" : "border-slate-200/10",
          isReversed ? "rotate-180" : ""
        ].join(" ")}
      />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-50">
          {it.position}. {it.card.nameKo}
        </div>
        <div className="mt-1 text-xs text-slate-400">{it.card.nameEn}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{directionKo}</Badge>
          <Badge>{it.card.arcana === "MAJOR" ? "메이저" : "마이너"}</Badge>
        </div>
      </div>
    </div>
  );
}


