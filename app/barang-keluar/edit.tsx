import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
import { FotoBarangKeluar } from "@/types/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function EditBarangKeluar() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pemilikBarang, setPemilikBarang] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [barang, setBarang] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [newPhotos, setNewPhotos] = useState<ImagePicker.ImagePickerAsset[]>(
    [],
  );
  const [existingPhotos, setExistingPhotos] = useState<FotoBarangKeluar[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: row, error } = await supabase
        .from("barang_keluar")
        .select("*, foto_barang_keluar(*)")
        .eq("id", id)
        .single();

      if (error || !row) {
        Alert.alert("Error", "Data tidak ditemukan");
        router.back();
        return;
      }

      const [year, month, day] = row.tanggal.split("-").map(Number);
      setDate(new Date(year, month - 1, day));
      const [hours, minutes] = row.waktu.split(":").map(Number);
      const t = new Date();
      t.setHours(hours, minutes, 0, 0);
      setTime(t);
      setPemilikBarang(row.pemilik_barang ?? "");
      setTujuan(row.tujuan ?? "");
      setBarang(row.barang ?? "");
      setKeterangan(row.keterangan ?? "");

      if (row.foto_barang_keluar?.length) {
        const photos = await Promise.all(
          row.foto_barang_keluar.map(async (foto: FotoBarangKeluar) => {
            const { data } = await supabase.storage
              .from("barang_keluar")
              .createSignedUrl(foto.storage_path, 3600);
            return { ...foto, photo_url: data?.signedUrl ?? foto.photo_url };
          }),
        );
        setExistingPhotos(photos);
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Error", "Izin kamera diperlukan");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setNewPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (foto: FotoBarangKeluar) => {
    setRemovedPhotoIds((prev) => [...prev, foto.id]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== foto.id));
  };

  const uploadNewPhotos = async () => {
    for (const photo of newPhotos) {
      const ext = photo.uri.split(".").pop() ?? "jpg";
      const fileName = `${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("barang_keluar")
        .upload(fileName, arrayBuffer, {
          contentType: photo.mimeType ?? `image/${ext}`,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        continue;
      }

      const { data: signedData } = await supabase.storage
        .from("barang_keluar")
        .createSignedUrl(fileName, 31536000);

      await supabase.from("foto_barang_keluar").insert({
        photo_url: signedData?.signedUrl ?? "",
        storage_path: fileName,
        barang_keluar_id: id,
      });
    }
  };

  const deleteRemovedPhotos = async () => {
    for (const photoId of removedPhotoIds) {
      const { data: foto } = await supabase
        .from("foto_barang_keluar")
        .select("storage_path")
        .eq("id", photoId)
        .single();

      if (foto?.storage_path) {
        await supabase.storage
          .from("barang_keluar")
          .remove([foto.storage_path]);
      }
      await supabase.from("foto_barang_keluar").delete().eq("id", photoId);
    }
  };

  const handleSubmit = async () => {
    if (!pemilikBarang || !tujuan || !barang || !keterangan) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("barang_keluar")
      .update({
        tanggal: formatDate(date),
        waktu: formatTime(time),
        pemilik_barang: pemilikBarang.trim(),
        tujuan: tujuan.trim(),
        barang: barang.trim(),
        keterangan: keterangan.trim(),
      })
      .eq("id", id);

    if (error) {
      setLoading(false);
      Alert.alert("Gagal", error.message);
      return;
    }

    if (removedPhotoIds.length > 0) {
      await deleteRemovedPhotos();
    }

    if (newPhotos.length > 0) {
      await uploadNewPhotos();
    }

    setLoading(false);
    Alert.alert("Berhasil", "Data berhasil diperbarui", [
      { text: "OK", onPress: () => router.back() },
    ]);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0a7ea4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Barang Keluar</Text>
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
            <Text style={styles.sectionLabel}>Informasi Barang</Text>
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="account-arrow-left"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={pemilikBarang}
                  onChangeText={setPemilikBarang}
                  placeholder="Nama pemilik barang"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={tujuan}
                  onChangeText={setTujuan}
                  placeholder="Tujuan pengiriman"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={barang}
                  onChangeText={setBarang}
                  placeholder="Nama barang"
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
                  value={keterangan}
                  onChangeText={setKeterangan}
                  placeholder="Keterangan"
                  placeholderTextColor="#4b5060"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dokumentasi Foto</Text>
            <View style={styles.sectionCard}>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={22}
                    color="#0a7ea4"
                  />
                  <Text style={styles.photoBtnText}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={22}
                    color="#0a7ea4"
                  />
                  <Text style={styles.photoBtnText}>Galeri</Text>
                </TouchableOpacity>
              </View>

              {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                <View style={styles.photoGrid}>
                  {existingPhotos.map((foto) => (
                    <View key={foto.id} style={styles.photoThumbWrap}>
                      <TouchableOpacity
                        onPress={() => setPreviewImage(foto.photo_url)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: foto.photo_url }}
                          style={styles.photoImage}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => removeExistingPhoto(foto)}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={14}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {newPhotos.map((photo, index) => (
                    <View key={`new-${index}`} style={styles.photoThumbWrap}>
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
                        onPress={() => removeNewPhoto(index)}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={14}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {existingPhotos.length === 0 && newPhotos.length === 0 && (
                <View style={styles.photoEmpty}>
                  <MaterialCommunityIcons
                    name="image-off-outline"
                    size={32}
                    color="#3a3d47"
                  />
                  <Text style={styles.photoEmptyText}>
                    Belum ada foto ditambahkan
                  </Text>
                </View>
              )}
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
  photoActions: {
    flexDirection: "row",
    gap: 1,
    backgroundColor: "#252830",
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#1a1d27",
  },
  photoBtnText: { fontSize: 14, fontWeight: "600", color: "#c0c4cc" },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
  },
  photoThumbWrap: { position: "relative" },
  photoImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#252830",
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
  photoEmpty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  photoEmptyText: { fontSize: 13, color: "#4b5060" },
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
});
