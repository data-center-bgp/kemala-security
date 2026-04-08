import { useAuth } from "@/context/auth";
import { useRouter } from "expo-router";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/orang-masuk" as any)}
          >
            <Text style={styles.cardIcon}>🟢</Text>
            <Text style={styles.cardTitle}>Orang Masuk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/orang-keluar" as any)}
          >
            <Text style={styles.cardIcon}>🔴</Text>
            <Text style={styles.cardTitle}>Orang Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add */}
        <Text style={styles.sectionTitle}>Tambah Cepat</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.card, styles.cardAccent]}
            onPress={() => router.push("/orang-masuk/add")}
          >
            <Text style={styles.cardIcon}>➕</Text>
            <Text style={styles.cardTitleLight}>Catat Masuk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, styles.cardAccent]}
            onPress={() => router.push("/orang-keluar/add")}
          >
            <Text style={styles.cardIcon}>➕</Text>
            <Text style={styles.cardTitleLight}>Catat Keluar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sign Out */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  greeting: {
    fontSize: 14,
    color: "#687076",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginTop: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardAccent: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  cardTitleLight: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signOutButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
