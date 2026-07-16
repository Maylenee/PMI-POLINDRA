import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, UserCheck, Users, Download } from "lucide-react";
import { loadPmiData, Mahasiswa, KelompokSeminar, Pembimbing } from "../data";
import "./PembimbingList.css";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function JadwalSeminar() {
  const [data, setData] = useState(() => loadPmiData());

  useEffect(() => {
    const interval = setInterval(() => setData(loadPmiData()), 2000);
    return () => clearInterval(interval);
  }, []);

  function handleExportSeminar() {
    const headers = ["KELOMPOK", "TANGGAL", "HARI", "WAKTU", "RUANG", "ANGGOTA", "PEMBIMBING"];
    const csvContent = [headers.join(","), ...data.kelompok.map((k: KelompokSeminar) => {
      const anggota = data.mahasiswa.filter((m: Mahasiswa) => k.mahasiswaIds.includes(m.id)).map((m) => m.nama).join("; ");
      const pembimbing = data.pembimbing.find((p: Pembimbing) => p.id === k.pembimbingId);
      const d = k.tanggal ? new Date(k.tanggal + "T00:00:00") : null;
      const hari = d ? HARI[d.getDay()] : "";
      return [`"${k.nama}"`, k.tanggal, hari, `"${k.waktu}"`, `"${k.ruang}"`, `"${anggota}"`, `"${pembimbing?.nama || "-"}"`].join(",");
    })].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "jadwal-seminar.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pmb-view">
      <div className="pmb-card">
        <div className="pmb-controls">
          <div className="pmb-controls-left">
            <span className="pmb-controls-label" style={{ fontWeight: 600, fontSize: 16 }}>
              <Calendar size={18} /> Jadwal Seminar Hasil Magang
            </span>
          </div>
          <div className="pmb-controls-right">
            <button className="pmb-export-btn" onClick={handleExportSeminar}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {data.kelompok.length === 0 ? (
          <div className="pmb-empty" style={{ padding: "60px 0" }}>Belum ada jadwal seminar</div>
        ) : (
          <div className="pmb-seminar-list">
            {[...data.kelompok].sort((a, b) => a.tanggal.localeCompare(b.tanggal)).map((k) => {
              const anggota = data.mahasiswa.filter((m: Mahasiswa) => k.mahasiswaIds.includes(m.id));
              const pembimbing = data.pembimbing.find((p: Pembimbing) => p.id === k.pembimbingId);
              const d = k.tanggal ? new Date(k.tanggal + "T00:00:00") : null;
              return (
                <div className="pmb-seminar-card" key={k.id}>
                  <div className="pmb-seminar-header">
                    <span className="pmb-seminar-nama">{k.nama}</span>
                    {d && <span className="pmb-seminar-hari">{HARI[d.getDay()]}</span>}
                  </div>
                  <div className="pmb-seminar-body">
                    {d && (
                      <div className="pmb-seminar-info">
                        <Calendar size={15} />
                        <span>{d.getDate()} {BULAN[d.getMonth()]} {d.getFullYear()}</span>
                      </div>
                    )}
                    <div className="pmb-seminar-info">
                      <Clock size={15} />
                      <span>{k.waktu || "-"}</span>
                    </div>
                    <div className="pmb-seminar-info">
                      <MapPin size={15} />
                      <span>{k.ruang || "-"}</span>
                    </div>
                    <div className="pmb-seminar-info">
                      <UserCheck size={15} />
                      <span>Pembimbing: {pembimbing?.nama || "-"}</span>
                    </div>
                    <div className="pmb-seminar-info">
                      <Users size={15} />
                      <span>{anggota.length} Anggota: {anggota.map((m) => m.nama).join(", ") || "-"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pmb-footer">
          <span className="pmb-info">
            Total {data.kelompok.length} kelompok
          </span>
        </div>
      </div>
    </div>
  );
}
