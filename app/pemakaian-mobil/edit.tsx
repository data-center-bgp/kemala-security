import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import { ListMobil } from "@/types/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDate = (d: Date) => d.toISOString().split("T")[0];
const formatTime = (d: Date) => d.toTimeString().slice(0, 5);

export default function EditPemakaianMobil() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mobilList, setMobilList] = useState<ListMobil[]>([]);
  const [selectedMobil, setSelectedMobil] = useState<ListMobil | null>(null);
  const [showMobilPicker, setShowMobilPicker] = useState(false);
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [keperluan, setKeperluan] = useState("");

  const fetchMobil = useCallback(async () => {
    const { data, error } = await supabase
      .from("list_mobil")
      .select("*")
      .is("deleted_at", null)
      .order("nama", { ascending: true });
    if (!error && data) {
      setMobilList(data as ListMobil[]);
      return data as ListMobil[];
    }
    return [];
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const mobilData = await fetchMobil();

      const { data: row, error } = await supabase
        .from("pemakaian_mobil")
        .select("*, list_mobil(*)")
        .eq("id", id)
        .single();

      if (error || !row) {
        Alert.alert("Error", "Data tidak ditemukan");
        router.back();
        return;
      }

      const [year, month, day] = row.tanggal_pakai.split("-").map(Number);
      setDate(new Date(year, month - 1, day));
      const [hours, minutes] = row.waktu_pakai.split(":").map(Number);
      const t = new Date();
      t.setHours(hours, minutes, 0, 0);
      setTime(t);
      setNamaPeminjam(row.nama_peminjam ?? "");
      setKeperluan(row.keperluan ?? "");

      // Set selected mobil from fetched list or from joined data
      const matchedMobil = mobilData.find((m) => m.id === row.mobil_id);
      if (matchedMobil) {
        setSelectedMobil(matchedMobil);
      } else if (row.list_mobil) {
        setSelectedMobil(row.list_mobil as ListMobil);
      }

      setFetching(false);
    })();
  }, [id]);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  const handleSubmit = async () => {
    if (!selectedMobil || !namaPeminjam || !keperluan) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("pemakaian_mobil")
      .update({
        tanggal_pakai: formatDate(date),
        waktu_pakai: formatTime(time),
        mobil_id: selectedMobil.id,
        nama_peminjam: namaPeminjam.trim(),
        keperluan: keperluan.trim(),
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      Alert.alert("Berhasil", "Data berhasil diperbarui", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0a7ea4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Pemakaian Mobil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          {/* Date & Time Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Waktu Pencatatan</Text>
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={18}
                    color="#0a7ea4"
                  />
                  <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowTimePicker(true)}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={18}
                    color="#0a7ea4"
                  />
                  <Text style={styles.dateBtnText}>{formatTime(time)}</Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={onDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={true}
                  onChange={onTimeChange}
                />
              )}
            </View>
          </View>

          {/* Mobil Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Kendaraan</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.mobilSelectBtn}
                onPress={() => setShowMobilPicker(true)}
              >
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="car-side"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <Text
                  style={[
                    styles.mobilSelectText,
                    !selectedMobil && styles.mobilSelectPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedMobil
                    ? `${selectedMobil.brand} ${selectedMobil.nama} — ${selectedMobil.nomor_plat}`
                    : "Pilih mobil"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Informasi Peminjam</Text>
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="account"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={namaPeminjam}
                  onChangeText={setNamaPeminjam}
                  placeholder="Nama peminjam"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={[styles.inputGroup, { alignItems: "flex-start" }]}>
                <View style={[styles.inputIcon, { marginTop: 12 }]}>
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={keperluan}
                  onChangeText={setKeperluan}
                  placeholder="Keperluan pemakaian"
                  placeholderTextColor="#4b5060"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.submitInner}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.submitText}>Simpan Perubahan</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mobil Picker Modal */}
      <Modal visible={showMobilPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Mobil</Text>
              <TouchableOpacity onPress={() => setShowMobilPicker(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#8b9098"
                />
              </TouchableOpacity>
            </View>
            {mobilList.length === 0 ? (
              <View style={styles.modalEmpty}>
                <MaterialCommunityIcons
                  name="car-off"
                  size={40}
                  color="#2a2d37"
                />
                <Text style={styles.modalEmptyText}>
                  Belum ada data mobil. Tambah mobil terlebih dahulu.
                </Text>
              </View>
            ) : (
              <FlatList
                data={mobilList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.mobilOption,
                      selectedMobil?.id === item.id &&
                        styles.mobilOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMobil(item);
                      setShowMobilPicker(false);
                    }}
                  >
                    <View style={styles.mobilOptionRow}>
                      <MaterialCommunityIcons
                        name="car"
                        size={18}
                        color={
                          selectedMobil?.id === item.id ? "#0a7ea4" : "#6b7280"
                        }
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobilPlat}>{item.nomor_plat}</Text>
                        <Text style={styles.mobilName}>
                          {item.brand} {item.nama}
                        </Text>
                        <Text style={styles.mobilMeta}>
                          {item.tipe} • {item.warna}
                        </Text>
                      </View>
                      {selectedMobil?.id === item.id && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color="#0a7ea4"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  form: { padding: 16, gap: 20, paddingBottom: 32 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#1a1d27",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d37",
    overflow: "hidden",
  },
  row: { flexDirection: "row", gap: 1, backgroundColor: "#252830" },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#1a1d27",
  },
  dateBtnText: { fontSize: 15, color: "#e8eaed", fontWeight: "600" },
  mobilSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
  },
  mobilSelectText: {
    flex: 1,
    fontSize: 15,
    color: "#e8eaed",
    paddingVertical: 14,
  },
  mobilSelectPlaceholder: {
    color: "#4b5060",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: "#e8eaed",
  },
  divider: {
    height: 1,
    backgroundColor: "#252830",
    marginLeft: 44,
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 72,
  },
  submitButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1d27",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2d37",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#e8eaed" },
  modalEmpty: { padding: 40, alignItems: "center", gap: 12 },
  modalEmptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  mobilOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252830",
  },
  mobilOptionSelected: { backgroundColor: "rgba(10, 126, 164, 0.08)" },
  mobilOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mobilPlat: { fontSize: 14, fontWeight: "700", color: "#0a7ea4" },
  mobilName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e8eaed",
    marginTop: 2,
  },
  mobilMeta: { fontSize: 13, color: "#8b9098", marginTop: 2 },
});
