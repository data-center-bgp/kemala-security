import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import { ListMobil } from "@/types/database";
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const formatDate = (d: Date) => d.toISOString().split("T")[0];
const formatTime = (d: Date) => d.toTimeString().slice(0, 5);

export default function AddPemakaianMobil() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);

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
      .order("nama", { ascending: true });
    if (!error && data) {
      setMobilList(data as ListMobil[]);
    }
  }, []);

  useEffect(() => {
    fetchMobil();
  }, [fetchMobil]);

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
    const { error } = await supabase.from("pemakaian_mobil").insert({
      tanggal_pakai: formatDate(date),
      waktu_pakai: formatTime(time),
      mobil_id: selectedMobil.id,
      nama_peminjam: namaPeminjam.trim(),
      keperluan: keperluan.trim(),
      sekuriti_id: profileId,
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tambah Pemakaian</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Tanggal</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={onDateChange}
                />
              )}
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Waktu</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.inputText}>{formatTime(time)}</Text>
              </TouchableOpacity>
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

          <View style={styles.field}>
            <Text style={styles.label}>Mobil</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowMobilPicker(true)}
            >
              <Text
                style={[styles.inputText, !selectedMobil && styles.placeholder]}
              >
                {selectedMobil
                  ? `${selectedMobil.brand} ${selectedMobil.nama} — ${selectedMobil.nomor_plat}`
                  : "Pilih mobil"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nama Peminjam</Text>
            <TextInput
              style={styles.input}
              value={namaPeminjam}
              onChangeText={setNamaPeminjam}
              placeholder="Nama peminjam"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Keperluan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keperluan}
              onChangeText={setKeperluan}
              placeholder="Keperluan pemakaian"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Simpan</Text>
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
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {mobilList.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.emptyText}>
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
                    <Text style={styles.mobilPlat}>{item.nomor_plat}</Text>
                    <Text style={styles.mobilName}>
                      {item.brand} {item.nama}
                    </Text>
                    <Text style={styles.mobilMeta}>
                      {item.tipe} • {item.warna}
                    </Text>
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
  container: { flex: 1, backgroundColor: "#f5f7fa" },
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
  form: { padding: 20, gap: 18 },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  field: {},
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#11181C",
  },
  inputText: { fontSize: 16, color: "#11181C" },
  placeholder: { color: "#9ca3af" },
  textArea: { textAlignVertical: "top", minHeight: 80 },
  submitButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
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
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#11181C" },
  modalClose: { fontSize: 20, color: "#687076", padding: 4 },
  modalEmpty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
  mobilOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  mobilOptionSelected: { backgroundColor: "#f0f9ff" },
  mobilPlat: { fontSize: 14, fontWeight: "700", color: "#0a7ea4" },
  mobilName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#11181C",
    marginTop: 2,
  },
  mobilMeta: { fontSize: 13, color: "#687076", marginTop: 2 },
});
