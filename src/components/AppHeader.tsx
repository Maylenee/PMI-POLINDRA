import { MessageSquare, MapPin, GraduationCap, Calendar, Shield } from "lucide-react";
import "./AppHeader.css";

type ChatTab = "chat" | "map" | "pembimbing" | "seminar";

export default function AppHeader({ mode, onToggle, tab, onTabChange }: {
  mode: "chat" | "admin";
  onToggle: () => void;
  tab: ChatTab;
  onTabChange: (t: ChatTab) => void;
}) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <img src="/logo.png" alt="Logo Polindra" className="app-header-logo" />
        <div className="app-header-text">
          <h1 className="app-header-title">Program Magang Industri (PMI)</h1>
          <p className="app-header-subtitle">Jurusan Teknik Informatika — Politeknik Negeri Indramayu</p>
        </div>
      </div>
      <div className="app-header-actions">
        <button className={`mode-toggle ${tab === "chat" ? "mode-toggle--active" : ""}`} onClick={() => onTabChange("chat")}>
          <MessageSquare size={14} /> Chat
        </button>
        <button className={`mode-toggle ${tab === "map" ? "mode-toggle--active" : ""}`} onClick={() => onTabChange("map")}>
          <MapPin size={14} /> Sebaran
        </button>
        <button className={`mode-toggle ${tab === "pembimbing" ? "mode-toggle--active" : ""}`} onClick={() => onTabChange("pembimbing")}>
          <GraduationCap size={14} /> Pembimbing
        </button>
        <button className={`mode-toggle ${tab === "seminar" ? "mode-toggle--active" : ""}`} onClick={() => onTabChange("seminar")}>
          <Calendar size={14} /> Jadwal Seminar
        </button>
        <button className="mode-toggle mode-toggle--admin" onClick={onToggle}>
          <Shield size={14} /> Admin
        </button>
      </div>
    </header>
  );
}
