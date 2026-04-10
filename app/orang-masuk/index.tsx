import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import { OrangMasuk } from "@/types/database";
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

export default function OrangMasukScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<OrangMasuk[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("orang_masuk")
      .select("*")
      .is("deleted_at", null)
      .order("tanggal", { ascending: false })
      .order("waktu", { ascending: false });

    if (!error && rows) {
      setData(rows as OrangMasuk[]);
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

  const handleDelete = (item: OrangMasuk) => {
    Alert.alert("Hapus Data", `Hapus data ${item.nama}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("orang_masuk")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", item.id);
          fetchData();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: OrangMasuk }) => (
    <TouchableOpacity onLongPress={() => handleDelete(item)} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowDate}>{item.tanggal}</Text>
        <Text style={styles.rowTime}>{item.waktu}</Text>
      </View>
      <Text style={styles.rowName}>{item.nama}</Text>
      <Text style={styles.rowDetail}>Asal: {item.asal}</Text>
      <Text style={styles.rowDetail}>Keperluan: {item.keperluan}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orang Masuk</Text>
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
            {loading ? (
              <ActivityIndicator size="large" color="#0a7ea4" />
            ) : (
              <Text style={styles.emptyText}>Belum ada data</Text>
            )}
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/orang-masuk/add")}
        >
          <Text style={styles.addButtonText}>+ Tambah Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1117" },
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
