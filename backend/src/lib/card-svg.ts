import type { TarotArcana, TarotSuit } from "@prisma/client";

export type CardSvgSize = "thumb" | "full";

export interface CardSvgInput {
  nameKo: string;
  nameEn: string;
  arcana: TarotArcana;
  suit: TarotSuit | null;
  rank: string | null;
}

/**
 * 카드 데이터로 즉석 SVG 이미지를 생성합니다.
 * 실제 이미지 파일이 없더라도 UI에서 "카드 앞면"처럼 보이도록 기본 템플릿을 제공합니다.
 */
export function buildCardSvg(input: CardSvgInput, size: CardSvgSize): string {
  const w = size === "thumb" ? 240 : 720;
  const h = size === "thumb" ? 400 : 1200;

  const suitLabel = input.suit ? suitKo(input.suit) : "";
  const arcanaLabel = input.arcana === "MAJOR" ? "메이저" : "마이너";
  const glyph = input.suit ? suitGlyph(input.suit) : "✶";
  const accent = input.arcana === "MAJOR" ? "#FDE68A" : "#E9D5FF";
  const accentSoft = input.arcana === "MAJOR" ? "rgba(245,158,11,0.10)" : "rgba(168,85,247,0.10)";

  const subtitle = [arcanaLabel, suitLabel].filter(Boolean).join(" · ");
  const rank = input.rank ? `#${input.rank}` : "";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070B1A"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.90"/>
      <stop offset="1" stop-color="#F59E0B" stop-opacity="0.55"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size === "thumb" ? 18 : 42}"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="${w}" height="${h}" rx="${Math.round(w * 0.06)}" fill="url(#bg)"/>
  <circle cx="${Math.round(w * 0.75)}" cy="${Math.round(h * 0.18)}" r="${Math.round(w * 0.55)}" fill="${accentSoft}" filter="url(#blur)"/>
  <circle cx="${Math.round(w * 0.20)}" cy="${Math.round(h * 0.80)}" r="${Math.round(w * 0.55)}" fill="rgba(59,130,246,0.10)" filter="url(#blur)"/>

  <rect x="${Math.round(w * 0.04)}" y="${Math.round(h * 0.03)}" width="${Math.round(w * 0.92)}" height="${Math.round(h * 0.94)}"
    rx="${Math.round(w * 0.05)}" fill="none" stroke="url(#gold)" stroke-opacity="0.35" stroke-width="${size === "thumb" ? 2 : 4}"/>
  <rect x="${Math.round(w * 0.065)}" y="${Math.round(h * 0.055)}" width="${Math.round(w * 0.87)}" height="${Math.round(h * 0.89)}"
    rx="${Math.round(w * 0.045)}" fill="none" stroke="url(#gold)" stroke-opacity="0.18" stroke-width="${size === "thumb" ? 1.5 : 3}"/>

  <g stroke="url(#gold)" stroke-opacity="0.18" stroke-width="${size === "thumb" ? 1 : 2}">
    <path d="M ${Math.round(w * 0.18)} ${Math.round(h * 0.22)} L ${Math.round(w * 0.32)} ${Math.round(h * 0.30)} L ${Math.round(w * 0.46)} ${Math.round(h * 0.24)} L ${Math.round(w * 0.60)} ${Math.round(h * 0.34)} L ${Math.round(w * 0.72)} ${Math.round(h * 0.22)}"/>
    <path d="M ${Math.round(w * 0.26)} ${Math.round(h * 0.68)} L ${Math.round(w * 0.40)} ${Math.round(h * 0.78)} L ${Math.round(w * 0.56)} ${Math.round(h * 0.72)} L ${Math.round(w * 0.70)} ${Math.round(h * 0.80)}"/>
  </g>
  <g fill="#E5E7EB" fill-opacity="0.10">
    <circle cx="${Math.round(w * 0.18)}" cy="${Math.round(h * 0.22)}" r="${size === "thumb" ? 2 : 4}"/>
    <circle cx="${Math.round(w * 0.32)}" cy="${Math.round(h * 0.30)}" r="${size === "thumb" ? 1.6 : 3}"/>
    <circle cx="${Math.round(w * 0.46)}" cy="${Math.round(h * 0.24)}" r="${size === "thumb" ? 1.4 : 3}"/>
    <circle cx="${Math.round(w * 0.60)}" cy="${Math.round(h * 0.34)}" r="${size === "thumb" ? 1.8 : 3.5}"/>
    <circle cx="${Math.round(w * 0.72)}" cy="${Math.round(h * 0.22)}" r="${size === "thumb" ? 1.4 : 3}"/>
    <circle cx="${Math.round(w * 0.26)}" cy="${Math.round(h * 0.68)}" r="${size === "thumb" ? 1.4 : 3}"/>
    <circle cx="${Math.round(w * 0.40)}" cy="${Math.round(h * 0.78)}" r="${size === "thumb" ? 1.6 : 3}"/>
    <circle cx="${Math.round(w * 0.56)}" cy="${Math.round(h * 0.72)}" r="${size === "thumb" ? 1.8 : 3.5}"/>
    <circle cx="${Math.round(w * 0.70)}" cy="${Math.round(h * 0.80)}" r="${size === "thumb" ? 1.5 : 3}"/>
  </g>

  <text x="${Math.round(w * 0.10)}" y="${Math.round(h * 0.14)}" fill="rgba(253,230,138,0.85)"
    font-family="ui-sans-serif, system-ui" font-size="${size === "thumb" ? 12 : 26}" letter-spacing="${size === "thumb" ? 3 : 6}">
    ARCANA-LAB
  </text>

  <text x="${Math.round(w * 0.50)}" y="${Math.round(h * 0.52)}" text-anchor="middle" fill="url(#gold)"
    font-family="ui-serif, Georgia, serif" font-size="${size === "thumb" ? 72 : 200}" opacity="0.85">
    ${glyph}
  </text>

  <text x="${Math.round(w * 0.50)}" y="${Math.round(h * 0.72)}" text-anchor="middle" fill="rgba(241,245,249,0.92)"
    font-family="ui-sans-serif, system-ui" font-size="${size === "thumb" ? 18 : 46}" font-weight="600">
    ${escapeXml(input.nameKo)}
  </text>
  <text x="${Math.round(w * 0.50)}" y="${Math.round(h * 0.76)}" text-anchor="middle" fill="rgba(148,163,184,0.95)"
    font-family="ui-sans-serif, system-ui" font-size="${size === "thumb" ? 12 : 26}">
    ${escapeXml(input.nameEn)}
  </text>
  <text x="${Math.round(w * 0.50)}" y="${Math.round(h * 0.82)}" text-anchor="middle" fill="rgba(253,230,138,0.70)"
    font-family="ui-sans-serif, system-ui" font-size="${size === "thumb" ? 11 : 22}" letter-spacing="${size === "thumb" ? 1.5 : 3}">
    ${escapeXml(subtitle)} ${escapeXml(rank)}
  </text>
</svg>`;

  return svg.trim();
}

function escapeXml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function suitKo(s: TarotSuit): string {
  if (s === "WANDS") return "완드";
  if (s === "CUPS") return "컵";
  if (s === "SWORDS") return "소드";
  return "펜타클";
}

function suitGlyph(s: TarotSuit): string {
  if (s === "WANDS") return "✶";
  if (s === "CUPS") return "☾";
  if (s === "SWORDS") return "⟠";
  return "✦";
}




