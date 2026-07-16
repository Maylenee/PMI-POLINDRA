import { useState, useEffect, useMemo } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { loadPmiData, Mahasiswa, Industri } from "../data";
import "./PembimbingList.css";

export default function PembimbingList() {
  const [data, setData] = useState(() => loadPmiData());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const interval = setInterval(() => setData(loadPmiData()), 2000);
    return () => clearInterval(interval);
  }, []);

  const rows = useMemo(() => {
    const result: { prodi: string; lokasi: string; industri: string; nama: string; nim: string; status: string }[] = [];
    data.mahasiswa.forEach((m: Mahasiswa) => {
      const ind = data.industri.find((i: Industri) => i.id === m.industriId);
      result.push({
        prodi: m.prodi === "TI" ? "D3 TI" : "D4 SIKC",
        lokasi: ind?.kota || "-",
        industri: ind?.nama || "-",
        nama: m.nama,
        nim: m.nim,
        kelas: m.kelas,
        pembimbingId: m.pembimbingId,
        status: m.status,
      });
    });
    return result;
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
  const paginated = pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, pageSize]);

  const prodiCount = useMemo(() => {
    const ti = rows.filter((r) => r.prodi === "D3 TI").length;
    const sikc = rows.filter((r) => r.prodi === "D4 SIKC").length;
    const industriList = [...new Set(rows.map((r) => r.industri))].length;
    return { ti, sikc, total: rows.length, industri: industriList };
  }, [rows]);

  function handleExport() {
    const headers = ["PROGRAM STUDI", "KABUPATEN/KOTA", "NAMA INDUSTRI", "NAMA MAHASISWA", "KELAS", "DOSEN PEMBIMBING"];
    const csvContent = [headers.join(","), ...filtered.map((r) => {
      const pembimbing = data.pembimbing.find((p) => p.id === r.pembimbingId);
      return [r.prodi, `"${r.lokasi}"`, `"${r.industri}"`, `"${r.nama}"`, r.kelas, `"${pembimbing?.nama || "-"}"`].join(",");
    })].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "data-mahasiswa.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pmb-view">
      <div className="pmb-summary">
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">{prodiCount.total}</div>
          <div className="pmb-summary-label">Total Mahasiswa</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">{prodiCount.ti}</div>
          <div className="pmb-summary-label">D3 TI</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">{prodiCount.sikc}</div>
          <div className="pmb-summary-label">D4 SIKC</div>
        </div>
        <div className="pmb-summary-card">
          <div className="pmb-summary-value">{prodiCount.industri}</div>
          <div className="pmb-summary-label">Industri Tujuan</div>
        </div>
      </div>

      <div className="pmb-card">
        <div className="pmb-controls">
          <div className="pmb-controls-left">
            <label className="pmb-controls-label">
              Tampilkan
              <select className="pmb-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={0}>Semua</option>
              </select>
              baris
            </label>
          </div>
          <div className="pmb-controls-right">
            <div className="pmb-search">
              <input
                type="text"
                placeholder="Ketik kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} />
            </div>
            <button className="pmb-export-btn" onClick={handleExport}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="pmb-table-wrap">
          <table className="pmb-table">
            <thead>
              <tr>
                <th>PROGRAM STUDI</th>
                <th>KABUPATEN/KOTA</th>
                <th>NAMA INDUSTRI</th>
                <th>NAMA MAHASISWA</th>
                <th>KELAS</th>
                <th>DOSEN PEMBIMBING</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="pmb-empty">Tidak ada data</td></tr>
              )}
              {paginated.map((r, i) => {
                const pembimbing = data.pembimbing.find((p) => p.id === r.pembimbingId);
                return (
                  <tr key={i}>
                    <td className="pmb-prodi">{r.prodi}</td>
                    <td>{r.lokasi}</td>
                    <td className="pmb-industri-cell">{r.industri}</td>
                    <td className="pmb-nama-cell">{r.nama}</td>
                    <td>{r.kelas}</td>
                    <td>{pembimbing?.nama || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pmb-footer">
          <span className="pmb-info">
            Menampilkan {filtered.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filtered.length)} dari {filtered.length} data
          </span>
          {pageSize > 0 && totalPages > 1 && (
            <div className="pmb-pagination">
              <button className="pmb-page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} className={`pmb-page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="pmb-page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
