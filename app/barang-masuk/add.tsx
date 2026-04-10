import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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

export default function AddBarangMasuk() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pengirim, setPengirim] = useState("");
  const [penerima, setPenerima] = useState("");
  const [barang, setBarang] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Error", "Izin kamera diperlukan");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (barangMasukId: string) => {
    for (const photo of photos) {
      const ext = photo.uri.split(".").pop() ?? "jpg";
      const fileName = `${barangMasukId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("barang_masuk")
        .upload(fileName, arrayBuffer, {
          contentType: photo.mimeType ?? `image/${ext}`,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        continue;
      }

      const { data: signedData } = await supabase.storage
        .from("barang_masuk")
        .createSignedUrl(fileName, 31536000);

      await supabase.from("foto_barang_masuk").insert({
        photo_url: signedData?.signedUrl ?? "",
        storage_path: fileName,
        barang_masuk_id: barangMasukId,
      });
    }
  };

  const handleSubmit = async () => {
    if (!pengirim || !penerima || !barang || !keterangan) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setLoading(true);
    const { data: inserted, error } = await supabase
      .from("barang_masuk")
      .insert({
        tanggal: formatDate(date),
        waktu: formatTime(time),
        pengirim: pengirim.trim(),
        penerima: penerima.trim(),
        barang: barang.trim(),
        keterangan: keterangan.trim(),
        sekuriti_id: profileId,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setLoading(false);
      Alert.alert("Gagal", error?.message ?? "Gagal menyimpan data");
      return;
    }

    if (photos.length > 0) {
      await uploadPhotos(inserted.id);
    }

    setLoading(false);
    Alert.alert("Berhasil", "Data berhasil ditambahkan", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
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
        <Text style={styles.title}>Tambah Barang Masuk</Text>
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
            <Text style={styles.label}>Pengirim</Text>
            <TextInput
              style={styles.input}
              value={pengirim}
              onChangeText={setPengirim}
              placeholder="Nama pengirim"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Penerima</Text>
            <TextInput
              style={styles.input}
              value={penerima}
              onChangeText={setPenerima}
              placeholder="Nama penerima"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Barang</Text>
            <TextInput
              style={styles.input}
              value={barang}
              onChangeText={setBarang}
              placeholder="Nama barang"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder="Keterangan"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Foto</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Text style={styles.photoButtonText}>📷 Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Text style={styles.photoButtonText}>🖼️ Galeri</Text>
              </TouchableOpacity>
            </View>
            {photos.length > 0 && (
              <View style={styles.photoRow}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoThumbContainer}>
                    <TouchableOpacity
                      onPress={() => setPreviewImage(photo.uri)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => removePhoto(index)}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  photoThumbContainer: { position: "relative" },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#2a2d37",
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#3a3d47",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#1a1d27",
  },
  photoButtonText: { fontSize: 14, fontWeight: "600", color: "#c0c4cc" },
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
});
