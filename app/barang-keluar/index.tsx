import { supabase } from "@/lib/supabase";
import { BarangKeluar, FotoBarangKeluar } from "@/types/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.barang?.toLowerCase().includes(q) ||
        item.pemilik_barang?.toLowerCase().includes(q) ||
        item.tujuan?.toLowerCase().includes(q) ||
        item.keterangan?.toLowerCase().includes(q) ||
        item.tanggal?.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

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

  const photoCount = (item: BarangKeluarWithPhotos) =>
    item.foto_barang_keluar?.length ?? 0;

  const renderItem = ({ item }: { item: BarangKeluarWithPhotos }) => (
    <TouchableOpacity
      onLongPress={() => handleDelete(item)}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <MaterialCommunityIcons name="package-up" size={20} color="#0a7ea4" />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.barang}
          </Text>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={12}
              color="#6b7280"
            />
            <Text style={styles.dateText}>
              {item.tanggal} • {item.waktu}
            </Text>
          </View>
        </View>
        {photoCount(item) > 0 && (
          <View style={styles.photoBadge}>
            <MaterialCommunityIcons name="image" size={12} color="#8b9098" />
            <Text style={styles.photoBadgeText}>{photoCount(item)}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="account-arrow-left"
            size={16}
            color="#6b7280"
          />
          <Text style={styles.detailLabel}>Pemilik</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {item.pemilik_barang}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color="#6b7280"
          />
          <Text style={styles.detailLabel}>Tujuan</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {item.tujuan}
          </Text>
        </View>
        {item.keterangan ? (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="text-box-outline"
              size={16}
              color="#6b7280"
            />
            <Text style={styles.detailLabel}>Ket</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {item.keterangan}
            </Text>
          </View>
        ) : null}
      </View>

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0a7ea4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barang Keluar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari barang, pemilik, tujuan..."
          placeholderTextColor="#4b5060"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredData}
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
              <>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={48}
                  color="#2a2d37"
                />
                <Text style={styles.emptyText}>
                  Belum ada data barang keluar
                </Text>
              </>
            )}
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/barang-keluar/add" as any)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Tambah Barang Keluar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1d27",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2d37",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#252830",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#e8eaed",
    textAlign: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1d27",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2d37",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#e8eaed",
  },
  list: { padding: 16, gap: 12, paddingBottom: 8 },
  card: {
    backgroundColor: "#1a1d27",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2d37",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(10, 126, 164, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleArea: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#e8eaed" },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  dateText: { fontSize: 12, color: "#6b7280" },
  photoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#252830",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoBadgeText: { fontSize: 11, color: "#8b9098", fontWeight: "600" },
  cardBody: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#252830",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    width: 66,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#c0c4cc",
    fontWeight: "500",
  },
  photoScroll: { marginTop: 12 },
  photoScrollContent: { gap: 8 },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#252830",
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
    backgroundColor: "rgba(255,255,255,0.15)",
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
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "#6b7280" },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1d27",
    borderTopWidth: 1,
    borderTopColor: "#2a2d37",
  },
  addButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
