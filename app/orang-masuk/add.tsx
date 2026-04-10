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

export default function AddOrangMasuk() {
  const router = useRouter();
  const { user, profileId } = useAuth();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nama, setNama] = useState("");
  const [asal, setAsal] = useState("");
  const [keperluan, setKeperluan] = useState("");

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  const handleSubmit = async () => {
    if (!nama || !asal || !keperluan) {
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
        <Text style={styles.title}>Tambah Orang Masuk</Text>
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
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              value={nama}
              onChangeText={setNama}
              placeholder="Nama pengunjung"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Asal</Text>
            <TextInput
              style={styles.input}
              value={asal}
              onChangeText={setAsal}
              placeholder="Asal / instansi"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Keperluan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keperluan}
              onChangeText={setKeperluan}
              placeholder="Tujuan / keperluan"
              placeholderTextColor="#6b7280"
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
  inputText: {
    fontSize: 16,
    color: "#e8eaed",
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 80,
  },
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
