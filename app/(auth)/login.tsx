import { useAuth } from "@/context/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GOLD = "#c9a96e";
const GOLD_LIGHT = "#e2cfa0";
const GOLD_DIM = "#8a7345";
const GOLD_MUTED = "rgba(201, 169, 110, 0.12)";
const DARK = "#0c0c0f";
const SURFACE = "#151518";
const SURFACE_LIGHT = "#1c1c20";
const BORDER = "#2a2820";
const TEXT_PRIMARY = "#f0ece4";
const TEXT_SECONDARY = "#9a9080";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo section */}
        <View style={styles.logoSection}>
          <View style={styles.logoGlow}>
            <Image
              source={require("@/assets/images/icon-kemala-security.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>KEMALA SECURITY</Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <MaterialCommunityIcons
              name="diamond-stone"
              size={10}
              color={GOLD_DIM}
            />
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.tagline}>Sistem Pencatatan Keamanan</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={GOLD_DIM}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#4a453a"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color={GOLD_DIM}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#4a453a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureEntry}
                textContentType="password"
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setSecureEntry(!secureEntry)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={secureEntry ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={GOLD_DIM}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={[loading && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={["#c9a96e", "#a8893f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color={DARK} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={18}
                    color={DARK}
                  />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Don't have an account? Contact IT division.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: GOLD_MUTED,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(201, 169, 110, 0.2)",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: GOLD_LIGHT,
    textAlign: "center",
    letterSpacing: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: GOLD_DIM,
    opacity: 0.4,
  },
  tagline: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "center",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 22,
    gap: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: GOLD_DIM,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: SURFACE_LIGHT,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  eyeBtn: {
    paddingRight: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: DARK,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  helpText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    textAlign: "center",
    marginTop: 28,
    letterSpacing: 0.3,
  },
});
