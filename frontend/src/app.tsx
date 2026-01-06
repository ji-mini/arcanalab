import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/common/app-shell";
import { HomePage } from "@/pages/home.page";
import { CardsPage } from "@/pages/cards/cards.page";
import { CardDetailPage } from "@/pages/cards/card-detail.page";
import { DrawPage } from "@/pages/draw/draw.page";
import { HistoryPage } from "@/pages/history/history.page";
import { HistoryDetailPage } from "@/pages/history/history-detail.page";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/cards/:id" element={<CardDetailPage />} />
        <Route path="/draw" element={<DrawPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:drawId" element={<HistoryDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}



