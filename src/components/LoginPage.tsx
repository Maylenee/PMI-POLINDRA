import { useState } from "react";
import "./LoginPage.css";

const AUTH_KEY = "pmi_auth";

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function login(username: string, password: string): boolean {
  if (username === "admin" && password === "admin123") {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Isi username dan password");
      return;
    }
    if (login(username, password)) {
      onLogin();
    } else {
      setError("Username atau password salah");
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">
          <img src="/logo.png" alt="Logo Polindra" />
        </div>
        <h1 className="login-title">Panel Admin PMI</h1>
        <p className="login-desc">Masuk untuk mengelola data</p>

        <div className="login-field">
          <label className="login-label">Username</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            autoFocus
          />
        </div>

        <div className="login-field">
          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-btn">Masuk</button>
      </form>
    </div>
  );
}
