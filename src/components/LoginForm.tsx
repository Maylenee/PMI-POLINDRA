import { useState } from "react";
import "./LoginForm.css";

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Harap isi semua field");
      return;
    }
    if (username === "admin" && password === "admin") {
      onLogin();
    } else {
      setError("Username atau password salah");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">
          <img src="/logo.png" alt="PMI Polindra" />
        </div>
        <h2 className="login-title">Admin PMI Polindra</h2>
        <p className="login-desc">Masuk ke panel administrasi</p>
        <div className="login-field">
          <label className="login-label">Username</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="Masukkan username"
          />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Masukkan password"
          />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button className="login-btn" type="submit">Masuk</button>
      </form>
    </div>
  );
}
