import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { CreateDrawRequest, CreateDrawResponse, DrawItemDto } from "@shared/contracts/draw.contract";
import { apiPost } from "@/lib/api";
import { Badge, Button, Card, Select } from "@/components/common/ui";
import { getCardThumbnailSrc } from "@/lib/card-image";

type CardCountValue = "1" | "2" | "3";

function MysticalLoadingLabel() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="text-amber-200/90 animate-spin [animation-duration:2.4s]"
      >
        ✶
      </span>
      <span className="bg-gradient-to-r from-amber-100 via-amber-200 to-violet-200 bg-clip-text text-transparent animate-pulse">
        뽑는 중
      </span>
      <span aria-hidden className="inline-flex items-end gap-0.5">
        <span className="inline-block animate-bounce [animation-delay:0ms]">.</span>
        <span className="inline-block animate-bounce [animation-delay:160ms]">.</span>
        <span className="inline-block animate-bounce [animation-delay:320ms]">.</span>
      </span>
    </span>
  );
}

export function DrawPage() {
  const [cardCount, setCardCount] = useState<CardCountValue>("1");

  const mutation = useMutation({
    mutationFn: (payload: CreateDrawRequest) => apiPost<CreateDrawResponse>("/draws", payload)
  });

  const selectedCount = useMemo(() => (cardCount === "2" ? 2 : cardCount === "3" ? 3 : 1), [cardCount]);

  return (
    <div className="space-y-6">
      <Card title="오늘의 카드 뽑기" description="1~3장을 선택하고, 기록 가능한 리딩을 생성합니다.">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300">뽑을 장수</div>
            <Select
              value={cardCount}
              onChange={(v) => setCardCount(v === "2" || v === "3" ? v : "1")}
              options={[
                { value: "1", label: "1장" },
                { value: "2", label: "2장" },
                { value: "3", label: "3장" }
              ]}
            />
          </div>
          <Button
            onClick={() => mutation.mutate({ cardCount: selectedCount })}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <MysticalLoadingLabel /> : "뽑기"}
          </Button>
        </div>

        {mutation.isError ? <div className="mt-4 text-sm text-rose-300">{mutation.error.message}</div> : null}
      </Card>

      {mutation.data ? (
        <Card
          title="결과"
          description={`${mutation.data.draw.date} · ${mutation.data.draw.cardCount}장`}
          action={
            <Link to={`/history/${mutation.data.draw.id}`}>
              <Button variant="secondary">기록 보기</Button>
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mutation.data.draw.items.map((it) => (
              <DrawCard key={it.id} item={it} />
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-slate-200/10 bg-slate-950/20 p-5 backdrop-blur">
            <div className="text-sm font-semibold text-slate-50">리딩</div>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{mutation.data.draw.readingText}</pre>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function DrawCard(props: { item: DrawItemDto }) {
  const it = props.item;
  const directionKo = it.orientation === "UPRIGHT" ? "정방향" : "역방향";
  const isReversed = it.orientation === "REVERSED";
  return (
    <div className="rounded-xl border border-slate-200/10 bg-slate-950/20 p-4 backdrop-blur">
      <img
        src={getCardThumbnailSrc(it.card)}
        alt={it.card.nameKo}
        className={[
          "aspect-[3/5] w-full rounded-md border border-slate-200/10 object-cover origin-center transform-gpu transition-transform duration-200",
          isReversed ? "rotate-180" : ""
        ].join(" ")}
      />
      <div className="mt-3 text-sm font-semibold text-slate-50">
        {it.position}. {it.card.nameKo}
      </div>
      <div className="mt-1 text-xs text-slate-400">{it.card.nameEn}</div>
      <div className="mt-2 flex items-center gap-2">
        <Badge>{directionKo}</Badge>
        <Badge>{it.card.arcana === "MAJOR" ? "메이저" : "마이너"}</Badge>
      </div>
    </div>
  );
}



