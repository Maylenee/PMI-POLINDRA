import { useState } from "react";
import { useT } from "../i18n";
import "./PMBView.css";

type PMBTab = "data" | "seminar";

export default function PMBView() {
  const { t } = useT();
  const [tab, setTab] = useState<PMBTab>("data");

  return (
    <div className="pmb-view">
      <div className="pmb-summary">
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">128</div>
          <div className="pmb-summary-label">Total Pendaftar</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">45</div>
          <div className="pmb-summary-label">Diterima</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">63</div>
          <div className="pmb-summary-label">Dalam Proses</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">20</div>
          <div className="pmb-summary-label">Ditolak</div>
        </div>
      </div>

      <div className="pmb-card">
        <div className="pmb-view-tabs">
          <button
            className={`pmb-view-tab ${tab === "data" ? "active" : ""}`}
            onClick={() => setTab("data")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
            </svg>
            Data Pendaftar
          </button>
          <button
            className={`pmb-view-tab ${tab === "seminar" ? "active" : ""}`}
            onClick={() => setTab("seminar")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Jadwal Seminar
          </button>
        </div>

        {tab === "data" ? <PMBDataTable /> : <PMBSeminarList />}
      </div>
    </div>
  );
}

function PMBDataTable() {
  return (
    <>
      <div className="pmb-controls">
        <div className="pmb-controls-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
          </svg>
          Prodi:
          <select className="pmb-select">
            <option>Semua</option>
            <option>Teknik Informatika</option>
            <option>Teknik Mesin</option>
            <option>Teknik Elektro</option>
          </select>
        </div>
        <div className="pmb-controls-right">
          <div className="pmb-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Cari pendaftar..." />
          </div>
          <button className="pmb-export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="pmb-table-wrap">
        <table className="pmb-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Prodi</th>
              <th>NIK</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[
              { no: 1, nama: "Ahmad Fauzi", prodi: "TI", nik: "1234567890", status: "diterima" },
              { no: 2, nama: "Siti Nurhaliza", prodi: "TM", nik: "1234567891", status: "proses" },
              { no: 3, nama: "Budi Santoso", prodi: "TE", nik: "1234567892", status: "proses" },
              { no: 4, nama: "Dewi Lestari", prodi: "TI", nik: "1234567893", status: "diterima" },
              { no: 5, nama: "Rudi Hermawan", prodi: "TM", nik: "1234567894", status: "diterima" },
            ].map((row) => (
              <tr key={row.no}>
                <td className="pmb-mono">{row.no}</td>
                <td className="pmb-nama-cell">{row.nama}</td>
                <td className="pmb-prodi">{row.prodi}</td>
                <td className="pmb-mono">{row.nik}</td>
                <td>
                  <span className={`pmb-status ${row.status}`}>
                    {row.status === "diterima" ? "Diterima" : "Dalam Proses"}
                  </span>
                </td>
                <td>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{cursor:"pointer"}}>
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pmb-footer">
        <div className="pmb-info">Menampilkan 1-5 dari 128 pendaftar</div>
        <div className="pmb-pagination">
          <button className="pmb-page-btn" disabled>Prev</button>
          <button className="pmb-page-btn active">1</button>
          <button className="pmb-page-btn">2</button>
          <button className="pmb-page-btn">3</button>
          <button className="pmb-page-btn">Next</button>
        </div>
      </div>
    </>
  );
}

function PMBSeminarList() {
  const seminars = [
    {
      nama: "Ahmad Fauzi",
      hari: "Senin",
      tanggal: "22 Juli 2026",
      jam: "09:00 - 10:00",
      ruang: "R. Seminar A",
      pembimbing: "Dr. Ir. H. Suherman, M.T.",
    },
    {
      nama: "Siti Nurhaliza",
      hari: "Senin",
      tanggal: "22 Juli 2026",
      jam: "10:00 - 11:00",
      ruang: "R. Seminar A",
      pembimbing: "Dr. Hj. Dewi Sartika, M.Kom.",
    },
    {
      nama: "Budi Santoso",
      hari: "Selasa",
      tanggal: "23 Juli 2026",
      jam: "09:00 - 10:00",
      ruang: "R. Seminar B",
      pembimbing: "Ir. H. Ahmad Yani, M.T.",
    },
  ];

  return (
    <div className="pmb-seminar-list">
      {seminars.map((s, i) => (
        <div key={i} className="pmb-seminar-card">
          <div className="pmb-seminar-header">
            <span className="pmb-seminar-nama">{s.nama}</span>
            <span className="pmb-seminar-hari">{s.hari}</span>
          </div>
          <div className="pmb-seminar-body">
            <div className="pmb-seminar-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {s.tanggal} • {s.jam}
            </div>
            <div className="pmb-seminar-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {s.ruang}
            </div>
            <div className="pmb-seminar-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {s.pembimbing}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
