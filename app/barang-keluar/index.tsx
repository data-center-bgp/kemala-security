import { supabase } from "@/lib/supabase";
import { BarangKeluar, FotoBarangKeluar } from "@/types/database";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BarangKeluarWithPhotos = BarangKeluar & {
  foto_barang_keluar?: FotoBarangKeluar[];
};

export default function BarangKeluarScreen() {
  const router = useRouter();
  const [data, setData] = useState<BarangKeluarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("barang_keluar")
      .select("*, foto_barang_keluar(*)")
      .is("deleted_at", null)
      .order("tanggal", { ascending: false })
      .order("waktu", { ascending: false });

    if (!error && rows) {
      const rowsWithUrls = await Promise.all(
        (rows as BarangKeluarWithPhotos[]).map(async (row) => {
          if (row.foto_barang_keluar?.length) {
            const photos = await Promise.all(
              row.foto_barang_keluar.map(async (foto) => {
                const { data } = await supabase.storage
                  .from("barang_keluar")
                  .createSignedUrl(foto.storage_path, 3600);
                return {
                  ...foto,
                  photo_url: data?.signedUrl ?? foto.photo_url,
                };
              }),
            );
            return { ...row, foto_barang_keluar: photos };
          }
          return row;
        }),
      );
      setData(rowsWithUrls);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (item: BarangKeluarWithPhotos) => {
    Alert.alert("Hapus Data", `Hapus data ${item.barang}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("barang_keluar")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", item.id);
          fetchData();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BarangKeluarWithPhotos }) => (
    <TouchableOpacity onLongPress={() => handleDelete(item)} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowDate}>{item.tanggal}</Text>
        <Text style={styles.rowTime}>{item.waktu}</Text>
      </View>
      <Text style={styles.rowName}>{item.barang}</Text>
      <Text style={styles.rowDetail}>Pemilik: {item.pemilik_barang}</Text>
      <Text style={styles.rowDetail}>Tujuan: {item.tujuan}</Text>
      <Text style={styles.rowDetail}>Keterangan: {item.keterangan}</Text>
      {item.foto_barang_keluar && item.foto_barang_keluar.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
          contentContainerStyle={styles.photoScrollContent}
        >
          {item.foto_barang_keluar.map((foto) => (
            <Image
              key={foto.id}
              source={{ uri: foto.photo_url }}
              style={styles.photoThumb}
            />
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Barang Keluar</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Belum ada data</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/barang-keluar/add" as any)}
        >
          <Text style={styles.addButtonText}>+ Tambah Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { fontSize: 15, color: "#0a7ea4", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#11181C" },
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowDate: { fontSize: 13, color: "#687076", fontWeight: "500" },
  rowTime: { fontSize: 13, color: "#687076" },
  rowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  rowDetail: { fontSize: 14, color: "#687076", marginTop: 2 },
  photoScroll: { marginTop: 10 },
  photoScrollContent: { gap: 8 },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  addButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
