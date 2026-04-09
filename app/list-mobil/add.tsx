import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddListMobil() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nomorPlat, setNomorPlat] = useState("");
  const [brand, setBrand] = useState("");
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState("");
  const [warna, setWarna] = useState("");

  const handleSubmit = async () => {
    if (!nomorPlat || !brand || !nama || !tipe || !warna) {
      Alert.alert("Error", "Harap isi semua field");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("list_mobil").insert({
      nomor_plat: nomorPlat.trim(),
      brand: brand.trim(),
      nama: nama.trim(),
      tipe: tipe.trim(),
      warna: warna.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      Alert.alert("Berhasil", "Mobil berhasil ditambahkan", [
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
        <Text style={styles.title}>Tambah Mobil</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nomor Plat</Text>
            <TextInput
              style={styles.input}
              value={nomorPlat}
              onChangeText={setNomorPlat}
              placeholder="Contoh: B 1234 ABC"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Contoh: Toyota"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              value={nama}
              onChangeText={setNama}
              placeholder="Contoh: Avanza"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipe</Text>
            <TextInput
              style={styles.input}
              value={tipe}
              onChangeText={setTipe}
              placeholder="Contoh: MPV"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Warna</Text>
            <TextInput
              style={styles.input}
              value={warna}
              onChangeText={setWarna}
              placeholder="Contoh: Hitam"
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
