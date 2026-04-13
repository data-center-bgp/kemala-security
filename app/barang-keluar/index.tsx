import { supabase } from "@/lib/supabase";
import { BarangKeluar, FotoBarangKeluar } from "@/types/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "range"
  >("all");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [showDateFrom, setShowDateFrom] = useState(false);
  const [showDateTo, setShowDateTo] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

  const onDateFromChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDateFrom(false);
    if (selected) {
      setDateFrom(selected);
      if (selected > dateTo) setDateTo(selected);
    }
  };

  const onDateToChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDateTo(false);
    if (selected) {
      setDateTo(selected);
      if (selected < dateFrom) setDateFrom(selected);
    }
  };

  const filteredData = useMemo(() => {
    let result = data;

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      if (dateFilter === "today") {
        result = result.filter((item) => item.tanggal === todayStr);
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().split("T")[0];
        result = result.filter((item) => item.tanggal >= weekStr);
      } else if (dateFilter === "range") {
        const fromStr = formatDateStr(dateFrom);
        const toStr = formatDateStr(dateTo);
        result = result.filter(
          (item) => item.tanggal >= fromStr && item.tanggal <= toStr,
        );
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.barang?.toLowerCase().includes(q) ||
          item.pemilik_barang?.toLowerCase().includes(q) ||
          item.tujuan?.toLowerCase().includes(q) ||
          item.keterangan?.toLowerCase().includes(q) ||
          item.tanggal?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [data, searchQuery, dateFilter, dateFrom, dateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const paginatedData = useMemo(
    () =>
      filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredData, page],
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, dateFilter, dateFrom, dateTo]);

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
    <View style={styles.card}>
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

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push(`/barang-keluar/edit?id=${item.id}` as any)
          }
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={16}
            color="#0a7ea4"
          />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDelete]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color="#ef4444"
          />
          <Text style={[styles.actionBtnText, styles.actionBtnDeleteText]}>
            Hapus
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "today", "week", "range"] as const).map((key) => {
          const labels = {
            all: "Semua",
            today: "Hari Ini",
            week: "7 Hari",
            range: "Rentang",
          };
          const icons = {
            all: "filter-off",
            today: "calendar-today",
            week: "calendar-week",
            range: "calendar-range",
          } as const;
          const active = dateFilter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setDateFilter(key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={icons[key]}
                size={14}
                color={active ? "#fff" : "#6b7280"}
              />
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {labels[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {dateFilter === "range" && (
        <View style={styles.dateRangeRow}>
          <TouchableOpacity
            style={styles.dateRangeBtn}
            onPress={() => setShowDateFrom(true)}
          >
            <MaterialCommunityIcons
              name="calendar-start"
              size={16}
              color="#0a7ea4"
            />
            <Text style={styles.dateRangeText}>{formatDateStr(dateFrom)}</Text>
          </TouchableOpacity>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color="#6b7280"
          />
          <TouchableOpacity
            style={styles.dateRangeBtn}
            onPress={() => setShowDateTo(true)}
          >
            <MaterialCommunityIcons
              name="calendar-end"
              size={16}
              color="#0a7ea4"
            />
            <Text style={styles.dateRangeText}>{formatDateStr(dateTo)}</Text>
          </TouchableOpacity>
        </View>
      )}
      {showDateFrom && (
        <DateTimePicker
          value={dateFrom}
          mode="date"
          onChange={onDateFromChange}
        />
      )}
      {showDateTo && (
        <DateTimePicker value={dateTo} mode="date" onChange={onDateToChange} />
      )}

      <FlatList
        data={paginatedData}
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

      {filteredData.length > ITEMS_PER_PAGE && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={page <= 1 ? "#3a3d47" : "#0a7ea4"}
            />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            {page} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.pageBtn,
              page >= totalPages && styles.pageBtnDisabled,
            ]}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={page >= totalPages ? "#3a3d47" : "#0a7ea4"}
            />
          </TouchableOpacity>
        </View>
      )}

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
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1a1d27",
    borderWidth: 1,
    borderColor: "#2a2d37",
  },
  filterChipActive: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  dateRangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1a1d27",
    borderWidth: 1,
    borderColor: "#2a2d37",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: "600",
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
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#252830",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(10, 126, 164, 0.1)",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  actionBtnDelete: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  actionBtnDeleteText: {
    color: "#ef4444",
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
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
    backgroundColor: "#0f1117",
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1d27",
    borderWidth: 1,
    borderColor: "#2a2d37",
    justifyContent: "center",
    alignItems: "center",
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8b9098",
  },
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
