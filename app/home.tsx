import { useAuth } from "@/context/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItemProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
};

function MenuItem({ icon, label, color, bg, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { profileName, profileRole, signOut } = useAuth();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  const handleSignOut = () => {
    setShowLogout(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profileName?.charAt(0).toUpperCase() ?? "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Selamat datang,</Text>
            <Text style={styles.email}>{profileName ?? "User"}</Text>
            {profileRole ? (
              <Text style={styles.role}>{profileRole}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        <Text style={styles.sectionTitle}>Pencatatan Orang</Text>
        <View style={styles.grid}>
          <MenuItem
            icon="account-arrow-right"
            label="Orang Masuk"
            color="#16a34a"
            bg="#dcfce7"
            onPress={() => router.push("/orang-masuk" as any)}
          />
          <MenuItem
            icon="account-arrow-left"
            label="Orang Keluar"
            color="#dc2626"
            bg="#fee2e2"
            onPress={() => router.push("/orang-keluar" as any)}
          />
        </View>

        <Text style={styles.sectionTitle}>Pencatatan Barang</Text>
        <View style={styles.grid}>
          <MenuItem
            icon="package-down"
            label="Barang Masuk"
            color="#2563eb"
            bg="#dbeafe"
            onPress={() => router.push("/barang-masuk" as any)}
          />
          <MenuItem
            icon="package-up"
            label="Barang Keluar"
            color="#ea580c"
            bg="#ffedd5"
            onPress={() => router.push("/barang-keluar" as any)}
          />
        </View>

        <Text style={styles.sectionTitle}>Kendaraan</Text>
        <View style={styles.grid}>
          <MenuItem
            icon="car-side"
            label="List Mobil"
            color="#7c3aed"
            bg="#ede9fe"
            onPress={() => router.push("/list-mobil" as any)}
          />
          <MenuItem
            icon="car-key"
            label="Pemakaian Mobil"
            color="#0891b2"
            bg="#cffafe"
            onPress={() => router.push("/pemakaian-mobil" as any)}
          />
        </View>

        <Text style={styles.sectionTitle}>Perizinan</Text>
        <View style={styles.grid}>
          <MenuItem
            icon="clipboard-text-outline"
            label="Izin Keluar"
            color="#ca8a04"
            bg="#fef9c3"
            onPress={() => router.push("/izin-keluar" as any)}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="logout" size={28} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Yakin ingin keluar dari akun ini?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogout(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowLogout(false);
                  signOut();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="logout" size={16} color="#fff" />
                <Text style={styles.modalConfirmText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1117",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#1a1d27",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2d37",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: "#8b9098",
  },
  email: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e8eaed",
    marginTop: 1,
  },
  role: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: "47%",
    backgroundColor: "#1a1d27",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2d37",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#c0c4cc",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: "#1a1d27",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#2a2d37",
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e8eaed",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#8b9098",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#252830",
    borderWidth: 1,
    borderColor: "#3a3d47",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#c0c4cc",
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#dc2626",
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
