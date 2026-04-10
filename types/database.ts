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

export type ListMobil = {
  id: string;
  nomor_plat: string;
  brand: string;
  nama: string;
  tipe: string;
  warna: string;
  created_at?: string;
};

export type PemakaianMobil = {
  id: string;
  tanggal_pakai: string;
  waktu_pakai: string;
  mobil_id: string;
  nama_peminjam: string;
  keperluan: string;
  sekuriti_id: number;
  created_at?: string;
  list_mobil?: ListMobil;
};

export type IzinKeluar = {
  id: string;
  tanggal: string;
  nama: string;
  keperluan: string;
  jam_keluar: string;
  jam_masuk: string;
  durasi_keluar: number;
  sekuriti_id: number;
  created_at?: string;
};

export type FotoBarangMasuk = {
  id: string;
  photo_url: string;
  storage_path: string;
  barang_masuk_id: string;
  created_at?: string;
};

export type FotoBarangKeluar = {
  id: string;
  photo_url: string;
  storage_path: string;
  barang_keluar_id: string;
  created_at?: string;
};
