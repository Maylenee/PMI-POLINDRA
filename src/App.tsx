import { useState, useCallback, useEffect } from "react";
import { I18nProvider } from "./i18n";
import RagChat from "./components/RagChat";
import AppHeader from "./components/AppHeader";
import AdminPanel from "./components/AdminPanel";
import LoginPage, { isLoggedIn, logout } from "./components/LoginPage";
import MapView from "./components/MapView";
import PembimbingList from "./components/PembimbingList";
import JadwalSeminar from "./components/JadwalSeminar";
import "./App.css";

type ChatTab = "chat" | "map" | "pembimbing" | "seminar";

export default function App() {
  const [mode, setMode] = useState<"chat" | "admin">("chat");
  const [tab, setTab] = useState<ChatTab>("chat");
  const [authed, setAuthed] = useState(isLoggedIn);

  const handleToggle = useCallback(() => { setMode(mode === "chat" ? "admin" : "chat"); }, [mode]);
  const handleLogin = useCallback(() => { setAuthed(true); setMode("admin"); }, []);
  const handleLogout = useCallback(() => { logout(); setAuthed(false); setMode("chat"); }, []);

  useEffect(() => {
    if (mode === "admin") { document.title = "PMI Admin — PMI Polindra"; return; }
    const titles: Record<string, string> = {
      chat: "PMI Chat",
      map: "Sebaran Industri — PMI Polindra",
      pembimbing: "Pembimbing — PMI Polindra",
      seminar: "Jadwal Seminar — PMI Polindra",
    };
    document.title = titles[tab] || "PMI Polindra";
  }, [tab, mode]);

  return (
    <I18nProvider>
      <div className={`app-shell ${mode === "admin" && authed ? "app-shell--full" : ""} ${mode === "chat" && tab !== "chat" ? "app-shell--wide" : ""}`}>
        {mode === "chat" && <AppHeader mode={mode} onToggle={handleToggle} tab={tab} onTabChange={setTab} />}
        <main className="app-main">
          {mode === "chat" && tab === "chat" && <RagChat />}
          {mode === "chat" && tab === "map" && <MapView />}
          {mode === "chat" && tab === "pembimbing" && <PembimbingList />}
          {mode === "chat" && tab === "seminar" && <JadwalSeminar />}
          {mode === "admin" && !authed && <LoginPage onLogin={handleLogin} />}
          {mode === "admin" && authed && <AdminPanel onLogout={handleLogout} onBack={handleToggle} />}
        </main>
      </div>
    </I18nProvider>
  );
}
