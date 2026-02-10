import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { GetTarotCardResponse, TarotSuit } from "@shared/contracts/cards.contract";
import { apiGet } from "@/lib/api";
import { Badge, Button, Card } from "@/components/common/ui";
import { getCardFullSrc } from "@/lib/card-image";

export function CardDetailPage() {
  const { id } = useParams();

  const cardQuery = useQuery({
    queryKey: ["cards", "detail", id],
    enabled: Boolean(id),
    queryFn: () => apiGet<GetTarotCardResponse>(`/cards/${id}`)
  });

  if (!id) {
    return (
      <Card title="카드 상세" description="잘못된 접근입니다.">
        <Link to="/cards" className="text-sm text-amber-100/80 hover:text-amber-100">
          목록으로
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">카드 상세</div>
          <div className="text-xl font-semibold text-slate-50">카드를 천천히 읽어봅니다.</div>
        </div>
        <Link to="/cards">
          <Button variant="secondary">목록</Button>
        </Link>
      </div>

      {cardQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
      {cardQuery.isError ? <div className="text-sm text-rose-300">{cardQuery.error.message}</div> : null}
      {cardQuery.data ? <CardDetailContent data={cardQuery.data} /> : null}
    </div>
  );
}

function CardDetailContent(props: { data: GetTarotCardResponse }) {
  const c = props.data.item;
  return (
    <Card
      title={`${c.nameKo} · ${c.nameEn}`}
      description={c.arcana === "MAJOR" ? "메이저 아르카나" : `마이너 아르카나 · ${c.suit ? suitKo(c.suit) : ""}`}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <img
            src={getCardFullSrc(c)}
            alt={c.nameKo}
            className={[
              "w-full rounded-xl border object-cover",
              c.arcana === "MAJOR"
                ? "border-2 border-amber-300/90 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_28px_rgba(251,191,36,0.18)]"
                : "border border-slate-200/10"
            ].join(" ")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{c.arcana === "MAJOR" ? "메이저" : "마이너"}</Badge>
            {c.suit ? <Badge>{suitKo(c.suit)}</Badge> : null}
            {c.rank ? <Badge>{c.rank}</Badge> : null}
          </div>
        </div>

        <div className="md:col-span-2">
          <Section title="핵심 키워드">
            {c.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {c.keywords.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-300">아직 등록된 키워드가 없습니다.</div>
            )}
          </Section>
          <Section title="기본 설명">
            <p className="whitespace-pre-wrap text-sm text-slate-200">{c.description}</p>
          </Section>
          <Section title="정방향 포인트">
            <p className="whitespace-pre-wrap text-sm text-slate-200">{c.uprightPoints}</p>
          </Section>
          <Section title="역방향 포인트">
            <p className="whitespace-pre-wrap text-sm text-slate-200">{c.reversedPoints}</p>
          </Section>
        </div>
      </div>
    </Card>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-sm font-semibold text-slate-50">{props.title}</div>
      <div className="mt-2">{props.children}</div>
    </div>
  );
}

function suitKo(s: TarotSuit): string {
  if (s === "WANDS") return "완드";
  if (s === "CUPS") return "컵";
  if (s === "SWORDS") return "소드";
  return "펜타클";
}



