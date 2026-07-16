export type Industri = { id: string; nama: string; alamat: string; kota: string; kontak: string; telepon: string; kuota: number; tipe: "eksisting" | "baru"; lat: number; lng: number };
export type Mahasiswa = { id: string; nama: string; nim: string; kelas: string; prodi: "TI" | "SIKC"; industriId: string; pembimbingId: string; status: "diterima" | "proses" };
export type Pembimbing = { id: string; nama: string; nidn: string; prodi: "TI" | "SIKC" };
export type KelompokSeminar = { id: string; nama: string; tanggal: string; waktu: string; ruang: string; mahasiswaIds: string[]; pembimbingId: string };
export type PmiData = { industri: Industri[]; mahasiswa: Mahasiswa[]; pembimbing: Pembimbing[]; kelompok: KelompokSeminar[] };

const STORAGE_KEY = "pmi_data";

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function seedData(): PmiData {
  const pembimbing: Pembimbing[] = [
    { id: "p1", nama: "Dr. Ahmad Fauzi, M.Kom", nidn: "0401018801", prodi: "TI" },
    { id: "p2", nama: "Dr. Dewi Sartika, M.T", nidn: "0402038902", prodi: "SIKC" },
    { id: "p3", nama: "Hendra Gunawan, M.Kom", nidn: "0403059003", prodi: "TI" },
    { id: "p4", nama: "Rina Marlina, M.T", nidn: "0404079104", prodi: "SIKC" },
  ];
  const industri: Industri[] = [
    { id: "i1", nama: "PT Teknologi Maju", alamat: "Jl. Sudirman No. 10", kota: "Cirebon", kontak: "Budi", telepon: "081234567890", kuota: 5, tipe: "eksisting", lat: -6.7, lng: 108.5 },
    { id: "i2", nama: "CV Karya Digital", alamat: "Jl. Merdeka No. 25", kota: "Indramayu", kontak: "Sari", telepon: "081234567891", kuota: 4, tipe: "eksisting", lat: -6.3, lng: 108.3 },
    { id: "i3", nama: "PT Solusi Pintar", alamat: "Jl. Raya Majalengka No. 5", kota: "Majalengka", kontak: "Agus", telepon: "081234567892", kuota: 3, tipe: "baru", lat: -6.8, lng: 108.2 },
    { id: "i4", nama: "PT Aplikasi Cerdas", alamat: "Jl. Siliwangi No. 88", kota: "Cirebon", kontak: "Dian", telepon: "081234567893", kuota: 4, tipe: "eksisting", lat: -6.72, lng: 108.55 },
    { id: "i5", nama: "Digital Kreasi Indo", alamat: "Jl. Pemuda No. 12", kota: "Indramayu", kontak: "Rizky", telepon: "081234567894", kuota: 3, tipe: "baru", lat: -6.32, lng: 108.33 },
  ];
  const mahasiswa: Mahasiswa[] = [
    { id: "m1", nama: "Ahmad Rizaldi", nim: "TI22001", kelas: "2A", prodi: "TI", industriId: "i1", pembimbingId: "p1", status: "diterima" },
    { id: "m2", nama: "Bunga Citra", nim: "TI22002", kelas: "2A", prodi: "TI", industriId: "i1", pembimbingId: "p1", status: "diterima" },
    { id: "m3", nama: "Cahyo Nugroho", nim: "TI22003", kelas: "2B", prodi: "TI", industriId: "i2", pembimbingId: "p3", status: "proses" },
    { id: "m4", nama: "Dewi Lestari", nim: "SIKC22001", kelas: "2A", prodi: "SIKC", industriId: "i2", pembimbingId: "p2", status: "diterima" },
    { id: "m5", nama: "Eko Prasetyo", nim: "TI22004", kelas: "2B", prodi: "TI", industriId: "i3", pembimbingId: "p3", status: "proses" },
    { id: "m6", nama: "Fitri Handayani", nim: "SIKC22002", kelas: "2A", prodi: "SIKC", industriId: "i4", pembimbingId: "p2", status: "diterima" },
    { id: "m7", nama: "Gilang Permana", nim: "TI22005", kelas: "3A", prodi: "TI", industriId: "i4", pembimbingId: "p1", status: "diterima" },
    { id: "m8", nama: "Hana Safira", nim: "SIKC22003", kelas: "2B", prodi: "SIKC", industriId: "i5", pembimbingId: "p4", status: "proses" },
    { id: "m9", nama: "Indra Kusuma", nim: "TI22006", kelas: "3A", prodi: "TI", industriId: "i5", pembimbingId: "p3", status: "diterima" },
    { id: "m10", nama: "Joko Widodo", nim: "TI22007", kelas: "2A", prodi: "TI", industriId: "i1", pembimbingId: "p1", status: "proses" },
    { id: "m11", nama: "Kartika Sari", nim: "SIKC22004", kelas: "2B", prodi: "SIKC", industriId: "i3", pembimbingId: "p4", status: "diterima" },
    { id: "m12", nama: "Lukman Hakim", nim: "TI22008", kelas: "3A", prodi: "TI", industriId: "i2", pembimbingId: "p3", status: "diterima" },
    { id: "m13", nama: "Maya Anggraini", nim: "SIKC22005", kelas: "2A", prodi: "SIKC", industriId: "i4", pembimbingId: "p2", status: "proses" },
    { id: "m14", nama: "Nanda Pratama", nim: "TI22009", kelas: "2B", prodi: "TI", industriId: "i3", pembimbingId: "p1", status: "diterima" },
    { id: "m15", nama: "Olivia Nurjanah", nim: "SIKC22006", kelas: "3A", prodi: "SIKC", industriId: "i5", pembimbingId: "p4", status: "diterima" },
  ];
  return { industri, mahasiswa, pembimbing, kelompok: [] };
}

export function resetPmiData(): PmiData {
  const seeded = seedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function isOldFormat(data: any): boolean {
  return data.mahasiswa?.length > 0 && data.mahasiswa.some((m: any) => m.kelas === undefined || m.pembimbingId === undefined);
}

export function loadPmiData(): PmiData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    const hasData = data.industri?.length || data.mahasiswa?.length || data.pembimbing?.length;
    if (hasData) {
      if (isOldFormat(data)) {
        return resetPmiData();
      }
      return {
        industri: data.industri ?? [],
        mahasiswa: data.mahasiswa ?? [],
        pembimbing: data.pembimbing ?? [],
        kelompok: data.kelompok ?? [],
      };
    }
  }
  return resetPmiData();
}
