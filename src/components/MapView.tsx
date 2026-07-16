import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { loadPmiData, Industri, Mahasiswa } from "../data";
import "./MapView.css";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedIndustri, setSelectedIndustri] = useState<Industri | null>(null);
  const [data, setData] = useState(() => {
    const raw = loadPmiData();
    return { ...raw, industri: raw.industri.filter((i) => i.kota !== "Medan") };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const raw = loadPmiData();
      setData({ ...raw, industri: raw.industri.filter((i) => i.kota !== "Medan") });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([-6.4, 108.3], 10);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/'>CARTO</a>",
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.eachLayer((layer) => { if ((layer as any).markerId) map.removeLayer(layer); });

    data.industri.forEach((ind) => {
      if (!ind.lat || !ind.lng) return;
      const color = ind.tipe === "baru" ? "#eab308" : "#1e40af";
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;font-size:11px;font-weight:600;"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([ind.lat, ind.lng], { icon }).addTo(map);
      (marker as any).markerId = ind.id;
      const mhsList = data.mahasiswa.filter((m: Mahasiswa) => m.industriId === ind.id);
      const mhsHtml = mhsList.length > 0
        ? `<div style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:6px;font-size:11px;">
             ${mhsList.map((m) => `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>${m.nama}</span><span style="color:#64748b;">${m.kelas} · ${m.prodi === "TI" ? "TI" : "SIKC"}</span></div>`).join("")}
           </div>`
        : "";
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:220px;line-height:1.5">
          <h3 style="margin:0 0 8px;font-size:14px;color:#1e40af;">${ind.nama}</h3>
          <p style="margin:0 0 4px;font-size:12px;color:#555;">${ind.alamat}, ${ind.kota}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#555;">${ind.kontak} — ${ind.telepon}</p>
          <p style="margin:0;font-size:12px;color:#555;">Tipe: ${ind.tipe} · ${countMahasiswa(ind.id)} peserta</p>
          ${mhsHtml}
        </div>
      `);
    });
  }, [data]);

  function countMahasiswa(industriId: string): number {
    return data.mahasiswa.filter((m: Mahasiswa) => m.industriId === industriId).length;
  }

  const groupedIndustri = (tipe: string) => data.industri.filter((i: Industri) => i.tipe === tipe);

  return (
    <div className="map-view">
      <div className="map-container" ref={mapRef} />
      <aside className="map-sidebar">
        <div className="map-sidebar-header">
          <h2>Sebaran Industri PMI 2026</h2>
          <p>{data.industri.length} industri &middot; {data.mahasiswa.length} mahasiswa</p>
        </div>
        <div className="map-sidebar-sections">
          <div className="map-section">
            <h3 className="map-section-title" data-tipe="eksisting">Eksisting ({groupedIndustri("eksisting").length})</h3>
            {groupedIndustri("eksisting").map((i) => (
              <button key={i.id} className={`map-industri-item ${selectedIndustri?.id === i.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedIndustri(i);
                  mapInstanceRef.current?.flyTo([i.lat, i.lng], 14, { duration: 0.8 });
                }}>
                <span className="map-industri-name">{i.nama}</span>
                <span className="map-industri-meta">{i.kota} · {countMahasiswa(i.id)} mhs</span>
              </button>
            ))}
          </div>
          <div className="map-section">
            <h3 className="map-section-title" data-tipe="baru">Baru ({groupedIndustri("baru").length})</h3>
            {groupedIndustri("baru").map((i) => (
              <button key={i.id} className={`map-industri-item ${selectedIndustri?.id === i.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedIndustri(i);
                  mapInstanceRef.current?.flyTo([i.lat, i.lng], 14, { duration: 0.8 });
                }}>
                <span className="map-industri-name">{i.nama}</span>
                <span className="map-industri-meta">{i.kota} · {countMahasiswa(i.id)} mhs</span>
              </button>
            ))}
          </div>
        </div>
        {selectedIndustri && (
          <div className="map-detail">
            <h4>{selectedIndustri.nama}</h4>
            <p>{selectedIndustri.alamat}, {selectedIndustri.kota}</p>
            <p>{selectedIndustri.kontak} — {selectedIndustri.telepon}</p>
            <p>{countMahasiswa(selectedIndustri.id)} peserta</p>
          </div>
        )}
      </aside>
    </div>
  );
}
