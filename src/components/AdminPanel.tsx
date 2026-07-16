import { useState, useEffect } from "react";
import { LayoutDashboard, Building2, Users, GraduationCap, Download, Upload, LogOut, ArrowLeft, Plus, Edit3, Trash2, CheckCircle, Clock, FileText, Briefcase, UserCheck, Calendar, Database, Server } from "lucide-react";
import "./AdminPanel.css";
import { loadPmiData } from "../data";
import { syncPmiData, ragFullSync, ragFiles, ragStats, ragUpload, ragExportDb } from "../api";

type Industri = { id: string; nama: string; alamat: string; kota: string; kontak: string; telepon: string; kuota: number; tipe: "eksisting" | "baru"; lat: number; lng: number };
type Mahasiswa = { id: string; nama: string; nim: string; kelas: string; prodi: "TI" | "SIKC"; industriId: string; pembimbingId: string; status: "diterima" | "proses" };
type Pembimbing = { id: string; nama: string; nidn: string; prodi: "TI" | "SIKC" };
type KelompokSeminar = { id: string; nama: string; tanggal: string; waktu: string; ruang: string; mahasiswaIds: string[]; pembimbingId: string };
type Page = "dashboard" | "industri" | "mahasiswa" | "pembimbing" | "kelompok" | "rag";

const STORAGE_KEY = "pmi_data";

function loadData() {
  return loadPmiData();
}
function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
  syncPmiData(data).catch(() => {});
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function AdminPanel({ onLogout, onBack }: { onLogout?: () => void; onBack?: () => void }) {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState<Page>("dashboard");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { saveData(data); }, [data]);

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "pmi-data.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { setData(JSON.parse(ev.target?.result as string)); } catch { alert("File JSON tidak valid"); } };
    reader.readAsText(file);
  }

  function deleteItem(type: string, id: string) {
    if (!confirm("Hapus data ini?")) return;
    setData((prev: any) => ({ ...prev, [type]: prev[type].filter((i: any) => i.id !== id) }));
  }

  const countTipe = (tipe: string) => data.industri.filter((i: Industri) => i.tipe === tipe).length;
  const countStatus = (status: string) => data.mahasiswa.filter((m: Mahasiswa) => m.status === status).length;
  const countProdi = (prodi: string) => data.mahasiswa.filter((m: Mahasiswa) => m.prodi === prodi).length;

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <img src="/logo.png" alt="Polindra" />
          <span>PMI Admin</span>
        </div>
        <nav className="admin-nav">
          {([["dashboard", "Dashboard"], ["industri", "Industri"], ["mahasiswa", "Mahasiswa"], ["pembimbing", "Pembimbing"], ["kelompok", "Kelompok Seminar"], ["rag", "RAG"]] as [Page, string][]).map(([key, label]) => (
            <button key={key} className={`admin-nav-item ${page === key ? "active" : ""}`} onClick={() => { setPage(key); setShowForm(false); setEditId(null); }}>
              <span className="admin-nav-icon">
                {key === "dashboard" ? <LayoutDashboard size={18} /> : key === "industri" ? <Building2 size={18} /> : key === "mahasiswa" ? <Users size={18} /> : key === "pembimbing" ? <GraduationCap size={18} /> : key === "kelompok" ? <Calendar size={18} /> : <Server size={18} />}
              </span>
              <span>{label}</span>
              {key === "industri" || key === "mahasiswa" || key === "pembimbing" || key === "kelompok" ? <span className="admin-nav-count">{data[key].length}</span> : null}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          {onBack && <button className="admin-sidebar-btn" onClick={onBack}><ArrowLeft size={14} /> Chat</button>}
          <label className="admin-sidebar-btn"><Upload size={14} /> Import<input type="file" accept=".json" onChange={handleImport} hidden /></label>
          <button className="admin-sidebar-btn" onClick={handleExport}><Download size={14} /> Export</button>
          {onLogout && <button className="admin-sidebar-btn admin-sidebar-btn--danger" onClick={onLogout}><LogOut size={14} /> Logout</button>}
        </div>
      </aside>

      <main className="admin-content">
        {page === "dashboard" && (
          <>
            <div className="admin-page-header"><h2>Dashboard</h2></div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card" style={{ borderTop: "3px solid #1e40af" }}>
                <span className="admin-stat-icon"><Building2 size={28} /></span>
                <div>
                  <div className="admin-stat-value">{data.industri.length}</div>
                  <div className="admin-stat-label">Total Industri</div>
                  <div className="admin-stat-sub">
                    <span>{countTipe("eksisting")} Eksisting</span>
                    <span> · </span>
                    <span>{countTipe("baru")} Baru</span>
                  </div>
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderTop: "3px solid #16a34a" }}>
                <span className="admin-stat-icon"><Users size={28} /></span>
                <div>
                  <div className="admin-stat-value">{data.mahasiswa.length}</div>
                  <div className="admin-stat-label">Total Mahasiswa</div>
                  <div className="admin-stat-sub">
                    <span>{countProdi("TI")} TI</span>
                    <span> · </span>
                    <span>{countProdi("SIKC")} SIKC</span>
                  </div>
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderTop: "3px solid #ca8a04" }}>
                <span className="admin-stat-icon"><GraduationCap size={28} /></span>
                <div>
                  <div className="admin-stat-value">{data.pembimbing.length}</div>
                  <div className="admin-stat-label">Total Pembimbing</div>
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderTop: "3px solid #dc2626" }}>
                <span className="admin-stat-icon"><CheckCircle size={28} /></span>
                <div>
                  <div className="admin-stat-value">{countStatus("diterima")}</div>
                  <div className="admin-stat-label">Mahasiswa Diterima</div>
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderTop: "3px solid #eab308" }}>
                <span className="admin-stat-icon"><Clock size={28} /></span>
                <div>
                  <div className="admin-stat-value">{countStatus("proses")}</div>
                  <div className="admin-stat-label">Dalam Proses</div>
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderTop: "3px solid #2563eb" }}>
                <span className="admin-stat-icon"><FileText size={28} /></span>
                <div>
                  <div className="admin-stat-value">{data.industri.reduce((a: number, i: Industri) => a + i.kuota, 0)}</div>
                  <div className="admin-stat-label">Total Kuota</div>
                </div>
              </div>
            </div>

            <div className="admin-quick-actions">
              <button className="admin-quick-btn" onClick={() => { setPage("industri"); setShowForm(true); setEditId(null); }}><Plus size={16} /> Tambah Industri</button>
              <button className="admin-quick-btn" onClick={() => { setPage("mahasiswa"); setShowForm(true); setEditId(null); }}><Plus size={16} /> Tambah Mahasiswa</button>
              <button className="admin-quick-btn" onClick={() => { setPage("pembimbing"); setShowForm(true); setEditId(null); }}><Plus size={16} /> Tambah Pembimbing</button>
              <button className="admin-quick-btn admin-quick-btn--secondary" onClick={handleExport}><Download size={16} /> Export Data</button>
            </div>

            <div className="admin-recent">
              <h3 className="admin-recent-title">Industri Terbaru</h3>
              {data.industri.length === 0 ? <p className="admin-empty">Belum ada data industri</p> : (
                <table className="admin-table">
                  <thead><tr><th>Nama</th><th>Kota</th><th>Tipe</th><th>Kuota</th></tr></thead>
                  <tbody>
                    {[...data.industri].reverse().slice(0, 5).map((i: Industri) => (
                      <tr key={i.id}><td>{i.nama}</td><td>{i.kota}</td><td><span className={`badge badge--${i.tipe}`}>{i.tipe}</span></td><td>{i.kuota}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {page === "rag" && (
          <RagPanel data={data} />
        )}

        {page !== "dashboard" && page !== "rag" && (
          <>
            <div className="admin-page-header">
              <h2>{page === "industri" ? "Data Industri" : page === "mahasiswa" ? "Data Mahasiswa" : "Data Pembimbing"}</h2>
              <button className="admin-add-btn" onClick={() => { setShowForm(true); setEditId(null); }}>
                <Plus size={16} /> Tambah {page === "industri" ? "Industri" : page === "mahasiswa" ? "Mahasiswa" : page === "pembimbing" ? "Pembimbing" : "Kelompok"}
              </button>
            </div>

            {showForm && (
              <ItemForm
                type={page}
                editId={editId}
                data={data}
                onSave={(item) => {
                  setData((prev: any) => {
                    const list = [...prev[page]];
                    if (editId) { const idx = list.findIndex((i: any) => i.id === editId); if (idx >= 0) list[idx] = item; }
                    else list.push(item);
                    return { ...prev, [page]: list };
                  });
                  setShowForm(false); setEditId(null);
                }}
                onCancel={() => { setShowForm(false); setEditId(null); }}
              />
            )}

            {page === "industri" && (
              <table className="admin-table">
                <thead><tr><th>Nama</th><th>Alamat</th><th>Kota</th><th>Kontak</th><th>Telepon</th><th>Kuota</th><th>Tipe</th><th></th></tr></thead>
                <tbody>
                  {data.industri.length === 0 && <tr><td colSpan={8} className="admin-empty-cell">Belum ada data</td></tr>}
                  {data.industri.map((item: Industri) => (
                    <tr key={item.id}>
                      <td>{item.nama}</td><td>{item.alamat}</td><td>{item.kota}</td><td>{item.kontak}</td><td>{item.telepon}</td><td>{item.kuota}</td>
                      <td><span className={`badge badge--${item.tipe}`}>{item.tipe}</span></td>
                      <td className="admin-table-actions">
                        <button className="admin-table-edit" onClick={() => { setEditId(item.id); setShowForm(true); }}><Edit3 size={14} /> Edit</button>
                        <button className="admin-table-delete" onClick={() => deleteItem("industri", item.id)}><Trash2 size={14} /> Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {page === "mahasiswa" && (
              <table className="admin-table">
                <thead><tr><th>Nama</th><th>NIM</th><th>Prodi</th><th>Industri</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {data.mahasiswa.length === 0 && <tr><td colSpan={6} className="admin-empty-cell">Belum ada data</td></tr>}
                  {data.mahasiswa.map((item: Mahasiswa) => {
                    const industri = data.industri.find((i: Industri) => i.id === item.industriId);
                    return (
                      <tr key={item.id}>
                        <td>{item.nama}</td><td>{item.nim}</td><td>{item.prodi}</td><td>{industri?.nama || "-"}</td>
                        <td><span className={`badge badge--${item.status}`}>{item.status}</span></td>
                        <td className="admin-table-actions">
                          <button className="admin-table-edit" onClick={() => { setEditId(item.id); setShowForm(true); }}><Edit3 size={14} /> Edit</button>
                          <button className="admin-table-delete" onClick={() => deleteItem("mahasiswa", item.id)}><Trash2 size={14} /> Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {page === "pembimbing" && (
              <table className="admin-table">
                <thead><tr><th>Nama</th><th>NIDN</th><th>Prodi</th><th></th></tr></thead>
                <tbody>
                  {data.pembimbing.length === 0 && <tr><td colSpan={4} className="admin-empty-cell">Belum ada data</td></tr>}
                  {data.pembimbing.map((item: Pembimbing) => (
                    <tr key={item.id}>
                      <td>{item.nama}</td><td>{item.nidn}</td><td>{item.prodi}</td>
                      <td className="admin-table-actions">
                        <button className="admin-table-edit" onClick={() => { setEditId(item.id); setShowForm(true); }}><Edit3 size={14} /> Edit</button>
                        <button className="admin-table-delete" onClick={() => deleteItem("pembimbing", item.id)}><Trash2 size={14} /> Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {page === "kelompok" && (
              <table className="admin-table">
                <thead><tr><th>Nama</th><th>Tanggal</th><th>Waktu</th><th>Ruang</th><th>Anggota</th><th>Pembimbing</th><th></th></tr></thead>
                <tbody>
                  {data.kelompok.length === 0 && <tr><td colSpan={7} className="admin-empty-cell">Belum ada data</td></tr>}
                  {data.kelompok.map((item: KelompokSeminar) => {
                    const anggota = data.mahasiswa.filter((m: Mahasiswa) => item.mahasiswaIds.includes(m.id));
                    const pembimbing = data.pembimbing.find((p: Pembimbing) => p.id === item.pembimbingId);
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.nama}</strong></td>
                        <td>{item.tanggal}</td>
                        <td>{item.waktu}</td>
                        <td>{item.ruang}</td>
                        <td>{anggota.map((m: Mahasiswa) => m.nama).join(", ") || "-"}</td>
                        <td>{pembimbing?.nama || "-"}</td>
                        <td className="admin-table-actions">
                          <button className="admin-table-edit" onClick={() => { setEditId(item.id); setShowForm(true); }}><Edit3 size={14} /> Edit</button>
                          <button className="admin-table-delete" onClick={() => deleteItem("kelompok", item.id)}><Trash2 size={14} /> Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function RagPanel({ data }: { data: any }) {
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dir, setDir] = useState<string>("");
  const [busy, setBusy] = useState<"" | "files" | "upload" | "pdf">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  async function refresh() {
    try {
      const f = await ragFiles();
      if (f.status === "ok") {
        setFiles(f.files || []);
        setDir(f.dir || "");
      } else if (f.status === "error") {
        setFiles([]);
        setDir(f.error || "");
      }
    } catch (e: any) {
      setFiles([]);
      setMsg({ kind: "err", text: "Gagal memuat daftar file: " + e.message });
    }
    try {
      const s = await ragStats();
      setStats(s);
    } catch {
      setStats(null);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function buildFromFiles() {
    setBusy("files");
    setMsg(null);
    try {
      const res = await ragFullSync(data);
      if (res.status === "ok") {
        const chunks = res.chunks ?? 0;
        setMsg({ kind: "ok", text: `RAG berhasil dibangun — ${res.docs ?? ""} dokumen, ${chunks} chunk terindeks untuk semantic search.` });
      } else {
        setMsg({ kind: "err", text: "Build dari file gagal: " + (res.error || JSON.stringify(res)) });
      }
    } catch (e: any) {
      setMsg({ kind: "err", text: "Build dari file gagal: " + e.message });
    } finally {
      setBusy("");
      refresh();
    }
  }

  async function handleUpload(file?: File) {
    const target = file ?? uploadFile;
    if (!target) {
      setMsg({ kind: "err", text: "Pilih file dulu." });
      return;
    }
    setBusy("upload");
    setMsg(null);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(target);
      });
      const res = await ragUpload(target.name, b64, overwrite);
      if (res.status === "ok") {
        setMsg({ kind: "ok", text: `File "${res.filename}" (${res.size} byte) berhasil diupload. Klik "Build RAG dari File" untuk mengindeks.` });
        setUploadFile(null);
        const input = document.getElementById("rag-upload-input") as HTMLInputElement | null;
        if (input) input.value = "";
      } else {
        setMsg({ kind: "err", text: "Upload gagal: " + (res.error || JSON.stringify(res)) });
      }
    } catch (e: any) {
      setMsg({ kind: "err", text: "Upload gagal: " + e.message });
    } finally {
      setBusy("");
      refresh();
    }
  }

  async function exportDbPdf() {
    setBusy("pdf");
    setMsg(null);
    try {
      const res = await ragExportDb(data);
      if (res.status === "ok") {
        setMsg({ kind: "ok", text: `PDF database dibuat (${res.filename}, ${res.size} byte). Klik "Build RAG dari File" untuk mengindeks.` });
      } else {
        setMsg({ kind: "err", text: "Gagal buat PDF: " + (res.error || JSON.stringify(res)) });
      }
    } catch (e: any) {
      setMsg({ kind: "err", text: "Gagal buat PDF: " + e.message });
    } finally {
      setBusy("");
      refresh();
    }
  }

  return (
    <div className="admin-rag">
      <div className="admin-page-header">
        <h2>Manajemen RAG</h2>
      </div>

      {msg && (
        <div className={`admin-rag-msg admin-rag-msg--${msg.kind}`}>{msg.text}</div>
      )}

      <div className="admin-rag-actions">
        <button className="admin-quick-btn" disabled={busy !== ""} onClick={buildFromFiles}>
          <Database size={16} /> {busy === "files" ? "Membangun..." : "Build RAG dari File"}
        </button>
        <button className="admin-quick-btn admin-quick-btn--secondary" disabled={busy !== ""} onClick={exportDbPdf}>
          <FileText size={16} /> {busy === "pdf" ? "Membuat PDF..." : "Generate PDF Database"}
        </button>
        <button className="admin-quick-btn admin-quick-btn--ghost" disabled={busy !== ""} onClick={refresh}>
          <Server size={16} /> Refresh
        </button>
      </div>

      <div className="admin-rag-upload">
        <h3>Upload File Sumber Baru</h3>
        <div className="admin-rag-upload-row">
          <input
            id="rag-upload-input"
            type="file"
            accept=".pdf,.json,.txt,.md,.docx,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setUploadFile(f);
                handleUpload(f);
              }
            }}
          />
          <button
            className="admin-quick-btn"
            disabled={busy !== ""}
            onClick={() => document.getElementById("rag-upload-input")?.click()}
          >
            <Upload size={16} /> {busy === "upload" ? "Mengupload..." : "Upload"}
          </button>
          {uploadFile && <span className="admin-rag-filename">{uploadFile.name}</span>}
          <label className={`admin-rag-overwrite ${overwrite ? "on" : ""}`}>
            <span className="admin-rag-overwrite-text">Timpa jika sudah ada</span>
            <span className="admin-rag-switch">
              <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
              <span className="admin-rag-slider" />
            </span>
          </label>
        </div>
        <p className="admin-rag-dir">
          File (PDF panduan, JSON, dll) akan disimpan ke <code>public/prepare-rag/files/</code>, lalu bisa diindeks lewat "Build RAG dari File".
        </p>
      </div>

      <p className="admin-rag-hint">
        <strong>Build RAG dari File</strong> memproses semua PDF yang ada di folder
        sumber <code>public/prepare-rag/files/</code> — termasuk <code>pmi-data.pdf</code> hasil tombol
        "Generate PDF Database".
        <br />
        <strong>Sync dari Database</strong> hanya membangun ulang dokumen <em>Data PMI Terkini</em> dari data JSON
        yang tersimpan di aplikasi (industri, mahasiswa, pembimbing, jadwal seminar).
      </p>

      {stats && stats.documents && (
        <div className="admin-rag-stats">
          <h3>Statistik Knowledge Base</h3>
          <table className="admin-table">
            <thead><tr><th>Doc ID</th><th>Halaman</th><th>Ukuran</th></tr></thead>
            <tbody>
              {stats.documents.map((d: any) => (
                <tr key={d.docId}>
                  <td>{d.docId}</td>
                  <td>{d.pages}</td>
                  <td>{(d.totalBytes / 1024).toFixed(1)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-rag-files">
        <h3>File Sumber (public/prepare-rag/files/)</h3>
        {dir && <p className="admin-rag-dir">{dir}</p>}
        {files.length === 0 ? (
          <p className="admin-empty">Belum ada file. Letakkan PDF / JSON panduan PMI di folder tersebut, lalu klik Refresh.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Nama File</th><th>Tipe</th><th>Ukuran</th></tr></thead>
            <tbody>
              {files.map((f: any) => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td><span className="badge badge--eksisting">{f.type}</span></td>
                  <td>{f.size >= 1024 ? (f.size / 1024).toFixed(1) + " KB" : f.size + " B"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ItemForm({ type, editId, data, onSave, onCancel }: { type: string; editId: string | null; data: any; onSave: (item: any) => void; onCancel: () => void }) {
  const existing = editId ? data[type].find((i: any) => i.id === editId) : null;
  const [form, setForm] = useState<any>(() => {
    if (existing) return { ...existing };
    if (type === "industri") return { id: genId(), nama: "", alamat: "", kota: "", kontak: "", telepon: "", kuota: 1, tipe: "eksisting", lat: -6.4, lng: 108.3 };
    if (type === "mahasiswa") return { id: genId(), nama: "", nim: "", kelas: "", prodi: "TI", industriId: "", pembimbingId: "", status: "proses" };
    if (type === "pembimbing") return { id: genId(), nama: "", nidn: "", prodi: "TI" };
    return { id: genId(), nama: "", tanggal: "", waktu: "", ruang: "", mahasiswaIds: [], pembimbingId: "" };
  });
  function set(field: string, value: any) { setForm((prev: any) => ({ ...prev, [field]: value })); }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!form.nama?.trim()) { alert("Nama harus diisi"); return; } onSave(form); }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3 className="admin-form-title">{editId ? "Edit" : "Tambah"} {type === "industri" ? "Industri" : type === "mahasiswa" ? "Mahasiswa" : type === "pembimbing" ? "Pembimbing" : "Kelompok Seminar"}</h3>
      <div className="admin-form-grid">
        <LabelInput label="Nama" value={form.nama || ""} onChange={(v) => set("nama", v)} required />
        {type === "industri" && (
          <><LabelInput label="Alamat" value={form.alamat || ""} onChange={(v) => set("alamat", v)} />
            <LabelInput label="Kota/Kabupaten" value={form.kota || ""} onChange={(v) => set("kota", v)} />
            <LabelInput label="Kontak Person" value={form.kontak || ""} onChange={(v) => set("kontak", v)} />
            <LabelInput label="No. Telepon" value={form.telepon || ""} onChange={(v) => set("telepon", v)} />
            <LabelInput label="Kuota Magang" type="number" value={form.kuota} onChange={(v) => set("kuota", parseInt(v) || 1)} />
            <div className="admin-form-field"><label className="admin-form-label">Tipe Industri</label>
              <select className="admin-form-input" value={form.tipe} onChange={(e) => set("tipe", e.target.value)}>
                <option value="eksisting">Eksisting</option><option value="baru">Baru</option>
              </select></div>
            <LabelInput label="Latitude" type="number" step="0.0001" value={form.lat} onChange={(v) => set("lat", parseFloat(v) || 0)} />
            <LabelInput label="Longitude" type="number" step="0.0001" value={form.lng} onChange={(v) => set("lng", parseFloat(v) || 0)} />
          </>
        )}
        {type === "mahasiswa" && (
          <><LabelInput label="NIM" value={form.nim || ""} onChange={(v) => set("nim", v)} />
            <div className="admin-form-field"><label className="admin-form-label">Prodi</label>
              <select className="admin-form-input" value={form.prodi} onChange={(e) => set("prodi", e.target.value)}>
                <option value="TI">D3 Teknik Informatika</option><option value="SIKC">D4 Sistem Informasi Kota Cerdas</option>
              </select></div>
            <div className="admin-field">
              <label>Kelas</label>
              <select value={form.kelas} onChange={(e) => set("kelas", e.target.value)}>
                <option value="">Pilih Kelas</option>
                <option value="2A">2A</option>
                <option value="2B">2B</option>
                <option value="3A">3A</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Pembimbing</label>
              <select value={form.pembimbingId} onChange={(e) => set("pembimbingId", e.target.value)}>
                <option value="">Pilih Pembimbing</option>
                {data.pembimbing.map((p: Pembimbing) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field"><label className="admin-form-label">Industri Tujuan</label>
              <select className="admin-form-input" value={form.industriId} onChange={(e) => set("industriId", e.target.value)}>
                <option value="">-- Pilih Industri --</option>
                {data.industri.map((i: Industri) => <option key={i.id} value={i.id}>{i.nama}</option>)}
              </select></div>
            <div className="admin-form-field"><label className="admin-form-label">Status Penerimaan</label>
              <select className="admin-form-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="proses">Proses Penerimaan</option><option value="diterima">Diterima</option>
              </select></div>
          </>
        )}
        {type === "pembimbing" && (
          <><LabelInput label="NIDN" value={form.nidn || ""} onChange={(v) => set("nidn", v)} />
            <div className="admin-form-field"><label className="admin-form-label">Prodi</label>
              <select className="admin-form-input" value={form.prodi} onChange={(e) => set("prodi", e.target.value)}>
                <option value="TI">D3 Teknik Informatika</option><option value="SIKC">D4 Sistem Informasi Kota Cerdas</option>
              </select></div>
          </>
        )}
        {type === "kelompok" && (
          <><LabelInput label="Nama Kelompok" value={form.nama || ""} onChange={(v) => set("nama", v)} required />
            <LabelInput label="Tanggal" type="date" value={form.tanggal || ""} onChange={(v) => set("tanggal", v)} />
            <LabelInput label="Waktu (misal: 09:00 - 11:00)" value={form.waktu || ""} onChange={(v) => set("waktu", v)} />
            <LabelInput label="Ruang" value={form.ruang || ""} onChange={(v) => set("ruang", v)} />
            <div className="admin-form-field"><label className="admin-form-label">Anggota Mahasiswa</label>
              <select className="admin-form-input" multiple size={4} value={form.mahasiswaIds || []} onChange={(e) => set("mahasiswaIds", Array.from(e.target.selectedOptions, (o) => o.value))}>
                {data.mahasiswa.map((m: Mahasiswa) => <option key={m.id} value={m.id}>{m.nama} ({m.nim})</option>)}
              </select>
              <small style={{ color: "#64748b", fontSize: 12, marginTop: 4, display: "block" }}>Pilih dengan Ctrl+klik</small>
            </div>
            <div className="admin-form-field"><label className="admin-form-label">Pembimbing</label>
              <select className="admin-form-input" value={form.pembimbingId} onChange={(e) => set("pembimbingId", e.target.value)}>
                <option value="">-- Pilih Pembimbing --</option>
                {data.pembimbing.map((p: Pembimbing) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select></div>
          </>
        )}
      </div>
      <div className="admin-form-buttons">
        <button type="submit" className="admin-form-save">Simpan</button>
        <button type="button" className="admin-form-cancel" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

function LabelInput({ label, value, onChange, type = "text", step, required }: { label: string; value: any; onChange: (v: string) => void; type?: string; step?: string; required?: boolean }) {
  return (
    <div className="admin-form-field">
      <label className="admin-form-label">{label}</label>
      <input className="admin-form-input" type={type} step={step} value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
