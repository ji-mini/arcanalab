import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ListTarotCardsResponse, TarotArcana, TarotSuit } from "@shared/contracts/cards.contract";
import { apiGet } from "@/lib/api";
import { Badge, Card, Select, TextInput } from "@/components/common/ui";
import { getCardThumbnailSrc } from "@/lib/card-image";

type ArcanaFilter = "ALL" | TarotArcana;
type SuitFilter = "ALL" | TarotSuit;

function buildQuery(params: { query: string; arcana: ArcanaFilter; suit: SuitFilter }) {
  const sp = new URLSearchParams();
  if (params.query.trim()) sp.set("query", params.query.trim());
  if (params.arcana !== "ALL") sp.set("arcana", params.arcana);
  if (params.suit !== "ALL") sp.set("suit", params.suit);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function CardsPage() {
  const [query, setQuery] = useState("");
  const [arcana, setArcana] = useState<ArcanaFilter>("ALL");
  const [suit, setSuit] = useState<SuitFilter>("ALL");

  const queryString = useMemo(() => buildQuery({ query, arcana, suit }), [query, arcana, suit]);

  const cardsQuery = useQuery({
    queryKey: ["cards", { query, arcana, suit }],
    queryFn: () => apiGet<ListTarotCardsResponse>(`/cards${queryString}`)
  });

  return (
    <div className="space-y-6">
      <Card title="카드 설명" description="78장 카드 목록을 검색하고 분류로 필터링합니다.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <TextInput value={query} onChange={setQuery} placeholder="검색 (한글/영문)" />
          <Select
            value={arcana}
            onChange={(v) => {
              const next = v === "MAJOR" || v === "MINOR" ? v : "ALL";
              setArcana(next);
              if (next === "MAJOR") setSuit("ALL");
            }}
            options={[
              { value: "ALL", label: "전체 (메이저/마이너)" },
              { value: "MAJOR", label: "메이저" },
              { value: "MINOR", label: "마이너" }
            ]}
          />
          <Select
            value={suit}
            onChange={(v) => setSuit(v === "WANDS" || v === "CUPS" || v === "SWORDS" || v === "PENTACLES" ? v : "ALL")}
            options={[
              { value: "ALL", label: "전체 슈트" },
              { value: "WANDS", label: "완드" },
              { value: "CUPS", label: "컵" },
              { value: "SWORDS", label: "소드" },
              { value: "PENTACLES", label: "펜타클" }
            ]}
          />
        </div>
        <div className="mt-3 text-xs text-slate-400">
          팁: 메이저 선택 시 슈트 필터는 의미가 없어서 자동으로 전체로 유지됩니다.
        </div>
      </Card>

      {cardsQuery.isLoading ? <div className="text-sm text-slate-300">불러오는 중...</div> : null}
      {cardsQuery.isError ? <div className="text-sm text-rose-300">{cardsQuery.error.message}</div> : null}

      {cardsQuery.data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {cardsQuery.data.items.map((c) => (
            <Link
              key={c.id}
              to={`/cards/${c.id}`}
              className="rounded-xl border border-slate-200/10 bg-slate-950/15 p-3 backdrop-blur hover:border-amber-200/25"
            >
              <img
                src={getCardThumbnailSrc(c)}
                alt={c.nameKo}
                className={[
                  "aspect-[3/5] w-full rounded-md border object-cover",
                  c.arcana === "MAJOR"
                    ? "border-[10px] border-amber-300/90 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_28px_rgba(251,191,36,0.18)]"
                    : "border border-slate-200/10"
                ].join(" ")}
                loading="lazy"
              />
              <div className="mt-2 truncate text-sm font-medium text-slate-100">{c.nameKo}</div>
              <div className="truncate text-xs text-slate-400">{c.nameEn}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge>{c.arcana === "MAJOR" ? "메이저" : "마이너"}</Badge>
                {c.suit ? <Badge>{suitKo(c.suit)}</Badge> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function suitKo(s: TarotSuit): string {
  if (s === "WANDS") return "완드";
  if (s === "CUPS") return "컵";
  if (s === "SWORDS") return "소드";
  return "펜타클";
}



