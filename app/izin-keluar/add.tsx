import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const calcDurasiMinutes = (keluar: Date, masuk: Date): number => {
  const diffMs = masuk.getTime() - keluar.getTime();
  return Math.max(0, Math.round(diffMs / 60000));
};

export default function AddIzinKeluar() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [jamKeluar, setJamKeluar] = useState(new Date());
  const [jamMasuk, setJamMasuk] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showKeluarPicker, setShowKeluarPicker] = useState(false);
  const [showMasukPicker, setShowMasukPicker] = useState(false);
  const [nama, setNama] = useState("");
  const [keperluan, setKeperluan] = useState("");

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onKeluarChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowKeluarPicker(false);
    if (selected) setJamKeluar(selected);
  };

  const onMasukChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowMasukPicker(false);
    if (selected) setJamMasuk(selected);
  };

  const durasi = calcDurasiMinutes(jamKeluar, jamMasuk);

  const formatDurasi = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  };

  const handleSubmit = async () => {
    if (!nama || !keperluan) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    if (jamMasuk <= jamKeluar) {
      Alert.alert("Error", "Jam masuk harus setelah jam keluar");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("izin_keluar").insert({
      tanggal: formatDate(date),
      nama: nama.trim(),
      keperluan: keperluan.trim(),
      jam_keluar: formatTime(jamKeluar),
      jam_masuk: formatTime(jamMasuk),
      durasi_keluar: durasi,
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
        <Text style={styles.title}>Tambah Izin Keluar</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
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

          <View style={styles.field}>
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              value={nama}
              onChangeText={setNama}
              placeholder="Nama yang izin keluar"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Keperluan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keperluan}
              onChangeText={setKeperluan}
              placeholder="Keperluan izin keluar"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Jam Keluar</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowKeluarPicker(true)}
              >
                <Text style={styles.inputText}>{formatTime(jamKeluar)}</Text>
              </TouchableOpacity>
              {showKeluarPicker && (
                <DateTimePicker
                  value={jamKeluar}
                  mode="time"
                  is24Hour={true}
                  onChange={onKeluarChange}
                />
              )}
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Jam Masuk</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowMasukPicker(true)}
              >
                <Text style={styles.inputText}>{formatTime(jamMasuk)}</Text>
              </TouchableOpacity>
              {showMasukPicker && (
                <DateTimePicker
                  value={jamMasuk}
                  mode="time"
                  is24Hour={true}
                  onChange={onMasukChange}
                />
              )}
            </View>
          </View>

          <View style={styles.durasiBox}>
            <Text style={styles.durasiLabel}>Durasi Keluar</Text>
            <Text style={styles.durasiValue}>
              {durasi > 0 ? formatDurasi(durasi) : "—"}
            </Text>
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
  form: { padding: 20, gap: 18 },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  field: {},
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c0c4cc",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3a3d47",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#1a1d27",
    color: "#e8eaed",
  },
  inputText: { fontSize: 16, color: "#e8eaed" },
  textArea: { textAlignVertical: "top", minHeight: 80 },
  durasiBox: {
    backgroundColor: "#0a2540",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a4d6e",
  },
  durasiLabel: { fontSize: 14, fontWeight: "600", color: "#c0c4cc" },
  durasiValue: { fontSize: 16, fontWeight: "700", color: "#0a7ea4" },
  submitButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
