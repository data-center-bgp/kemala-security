import { supabase } from "@/lib/supabase";
import { ListSekuriti } from "@/types/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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

export default function AddOrangMasuk() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nama, setNama] = useState("");
  const [asal, setAsal] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [sekuritiList, setSekuritiList] = useState<ListSekuriti[]>([]);
  const [selectedSekuriti, setSelectedSekuriti] = useState<ListSekuriti | null>(
    null,
  );
  const [showSekuritiPicker, setShowSekuritiPicker] = useState(false);

  const fetchSekuriti = useCallback(async () => {
    const { data, error } = await supabase
      .from("list_sekuriti")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });
    if (!error && data) setSekuritiList(data as ListSekuriti[]);
  }, []);

  useEffect(() => {
    fetchSekuriti();
  }, [fetchSekuriti]);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  const handleSubmit = async () => {
    if (!nama || !asal || !keperluan || !selectedSekuriti) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("orang_masuk").insert({
      tanggal: formatDate(date),
      waktu: formatTime(time),
      nama: nama.trim(),
      asal: asal.trim(),
      keperluan: keperluan.trim(),
      sekuriti_id: selectedSekuriti.id,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      Alert.alert("Berhasil", "Data berhasil ditambahkan", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0a7ea4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Orang Masuk</Text>
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

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Informasi Pengunjung</Text>
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
                  value={nama}
                  onChangeText={setNama}
                  placeholder="Nama pengunjung"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="office-building"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={asal}
                  onChangeText={setAsal}
                  placeholder="Asal / instansi"
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
                  placeholder="Tujuan / keperluan"
                  placeholderTextColor="#4b5060"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Sekuriti Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Petugas Sekuriti</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sekuritiSelectBtn}
                onPress={() => setShowSekuritiPicker(true)}
              >
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <Text
                  style={[
                    styles.sekuritiSelectText,
                    !selectedSekuriti && styles.sekuritiSelectPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedSekuriti ? selectedSekuriti.name : "Pilih sekuriti"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
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
                <Text style={styles.submitText}>Simpan Data</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sekuriti Picker Modal */}
      <Modal visible={showSekuritiPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Sekuriti</Text>
              <TouchableOpacity onPress={() => setShowSekuritiPicker(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#8b9098"
                />
              </TouchableOpacity>
            </View>
            {sekuritiList.length === 0 ? (
              <View style={styles.modalEmpty}>
                <MaterialCommunityIcons
                  name="shield-off-outline"
                  size={40}
                  color="#2a2d37"
                />
                <Text style={styles.modalEmptyText}>
                  Belum ada data sekuriti.
                </Text>
              </View>
            ) : (
              <FlatList
                data={sekuritiList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.sekuritiOption,
                      selectedSekuriti?.id === item.id &&
                        styles.sekuritiOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedSekuriti(item);
                      setShowSekuritiPicker(false);
                    }}
                  >
                    <View style={styles.sekuritiOptionRow}>
                      <MaterialCommunityIcons
                        name="shield-account"
                        size={18}
                        color={
                          selectedSekuriti?.id === item.id
                            ? "#0a7ea4"
                            : "#6b7280"
                        }
                      />
                      <Text style={styles.sekuritiName}>{item.name}</Text>
                      {selectedSekuriti?.id === item.id && (
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
  sekuritiSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
  },
  sekuritiSelectText: {
    flex: 1,
    fontSize: 15,
    color: "#e8eaed",
    paddingVertical: 14,
  },
  sekuritiSelectPlaceholder: { color: "#4b5060" },
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
  modalEmptyText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  sekuritiOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252830",
  },
  sekuritiOptionSelected: { backgroundColor: "rgba(10, 126, 164, 0.08)" },
  sekuritiOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sekuritiName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#e8eaed" },
});
