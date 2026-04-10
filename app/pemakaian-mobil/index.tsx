import { supabase } from "@/lib/supabase";
import { PemakaianMobil } from "@/types/database";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PemakaianMobilScreen() {
  const router = useRouter();
  const [data, setData] = useState<PemakaianMobil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("pemakaian_mobil")
      .select("*, list_mobil(*)")
      .is("deleted_at", null)
      .order("tanggal_pakai", { ascending: false })
      .order("waktu_pakai", { ascending: false });

    if (!error && rows) {
      setData(rows as PemakaianMobil[]);
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

  const handleDelete = (item: PemakaianMobil) => {
    Alert.alert("Hapus Data", `Hapus data pemakaian ${item.nama_peminjam}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("pemakaian_mobil")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", item.id);
          fetchData();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PemakaianMobil }) => {
    const mobil = item.list_mobil;
    return (
      <TouchableOpacity
        onLongPress={() => handleDelete(item)}
        style={styles.row}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.rowDate}>{item.tanggal_pakai}</Text>
          <Text style={styles.rowTime}>{item.waktu_pakai}</Text>
        </View>
        {mobil && (
          <Text style={styles.rowCar}>
            {mobil.brand} {mobil.nama} — {mobil.nomor_plat}
          </Text>
        )}
        <Text style={styles.rowName}>{item.nama_peminjam}</Text>
        <Text style={styles.rowDetail}>Keperluan: {item.keperluan}</Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>Pemakaian Mobil</Text>
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
          onPress={() => router.push("/pemakaian-mobil/add" as any)}
        >
          <Text style={styles.addButtonText}>+ Tambah Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1117" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#1a1d27",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2d37",
  },
  backButton: { fontSize: 15, color: "#0a7ea4", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#e8eaed" },
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: "#1a1d27",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2d37",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowDate: { fontSize: 13, color: "#8b9098", fontWeight: "500" },
  rowTime: { fontSize: 13, color: "#8b9098" },
  rowCar: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7ea4",
    marginBottom: 4,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e8eaed",
    marginBottom: 4,
  },
  rowDetail: { fontSize: 14, color: "#8b9098", marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#6b7280" },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1a1d27",
    borderTopWidth: 1,
    borderTopColor: "#2a2d37",
  },
  addButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
