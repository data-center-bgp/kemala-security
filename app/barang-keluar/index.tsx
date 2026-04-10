import { supabase } from "@/lib/supabase";
import { BarangKeluar, FotoBarangKeluar } from "@/types/database";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BarangKeluarWithPhotos = BarangKeluar & {
  foto_barang_keluar?: FotoBarangKeluar[];
};

export default function BarangKeluarScreen() {
  const router = useRouter();
  const [data, setData] = useState<BarangKeluarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
            <TouchableOpacity
              key={foto.id}
              onPress={() => setSelectedImage(foto.photo_url)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: foto.photo_url }}
                style={styles.photoThumb}
              />
            </TouchableOpacity>
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
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

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
  rowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e8eaed",
    marginBottom: 4,
  },
  rowDetail: { fontSize: 14, color: "#8b9098", marginTop: 2 },
  photoScroll: { marginTop: 10 },
  photoScrollContent: { gap: 8 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#2a2d37",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalImage: {
    width: Dimensions.get("window").width - 32,
    height: Dimensions.get("window").height * 0.7,
  },
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
