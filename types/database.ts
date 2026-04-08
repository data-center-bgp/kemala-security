export type OrangMasuk = {
  id: string;
  tanggal: string;
  waktu: string;
  nama: string;
  asal: string;
  keperluan: string;
  sekuriti_id: number;
  created_at?: string;
};

export type OrangKeluar = {
  id: string;
  tanggal: string;
  waktu: string;
  nama: string;
  keterangan: string;
  sekuriti_id: number;
  created_at?: string;
};

export type BarangMasuk = {
  id: string;
  tanggal: string;
  waktu: string;
  pengirim: string;
  penerima: string;
  barang: string;
  keterangan: string;
  sekuriti_id: number;
  created_at?: string;
};

export type BarangKeluar = {
  id: string;
  tanggal: string;
  waktu: string;
  pemilik_barang: string;
  tujuan: string;
  barang: string;
  keterangan: string;
  sekuriti_id: number;
  created_at?: string;
};
