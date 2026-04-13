import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function EditListMobil() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nomorPlat, setNomorPlat] = useState("");
  const [brand, setBrand] = useState("");
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState("");
  const [warna, setWarna] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("list_mobil")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        Alert.alert("Error", "Gagal memuat data mobil");
        router.back();
        return;
      }

      setNomorPlat(data.nomor_plat || "");
      setBrand(data.brand || "");
      setNama(data.nama || "");
      setTipe(data.tipe || "");
      setWarna(data.warna || "");
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!nomorPlat || !brand || !nama || !tipe || !warna) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("list_mobil")
      .update({
        nomor_plat: nomorPlat.trim(),
        brand: brand.trim(),
        nama: nama.trim(),
        tipe: tipe.trim(),
        warna: warna.trim(),
      })
      .eq("id", id);
    setSaving(false);

    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      Alert.alert("Berhasil", "Data mobil berhasil diperbarui", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
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
        <Text style={styles.headerTitle}>Edit Mobil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          {/* Identitas Kendaraan */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Identitas Kendaraan</Text>
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="card-text-outline"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={nomorPlat}
                  onChangeText={setNomorPlat}
                  placeholder="Nomor plat (B 1234 ABC)"
                  placeholderTextColor="#4b5060"
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="factory"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Brand (Toyota, Honda...)"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="car"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={nama}
                  onChangeText={setNama}
                  placeholder="Nama mobil (Avanza, Civic...)"
                  placeholderTextColor="#4b5060"
                />
              </View>
            </View>
          </View>

          {/* Detail Kendaraan */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Detail</Text>
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="car-cog"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={tipe}
                  onChangeText={setTipe}
                  placeholder="Tipe (MPV, SUV, Sedan...)"
                  placeholderTextColor="#4b5060"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={warna}
                  onChangeText={setWarna}
                  placeholder="Warna (Hitam, Putih...)"
                  placeholderTextColor="#4b5060"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
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
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
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
});
