import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { useAccess } from "@/context/AccessContext";
import { getBase } from "@/context/CoachingContext";
import { getCurrentPurchaseReceipt, getIapErrorMessage } from "@/lib/iap";

const PRIVACY_URL = "https://waitlist.amplify-x.co/privacy-policy";
const TERMS_URL = "https://waitlist.amplify-x.co/terms-of-service";
const FEEDBACK_MAILTO =
  "mailto:support@amplify-x.co?subject=Feedback%20-%20Amplify%20X%20Momentum";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clearProfile } = useUser();
  const { user, isPaid, signOut, sessionToken, refresh } = useAccess();

  const email = user?.email ?? "";
  const hasEmail = email.length > 0;

  const [busy, setBusy] = React.useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // Restore Purchases is required by Apple to be discoverable from the app
  // regardless of paid_status — a user who switches devices or reinstalls
  // needs an unconditional path back to their existing subscription.
  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const receipt = await getCurrentPurchaseReceipt();
      if (!receipt) {
        Alert.alert("Restore Purchases", "No active purchase found on this Apple ID.");
        return;
      }
      if (!sessionToken) {
        throw new Error("Not signed in.");
      }
      const res = await fetch(`${getBase()}/api/auth/apple-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, receipt }),
      });
      if (!res.ok) {
        throw new Error(`Server rejected the receipt (HTTP ${res.status}).`);
      }
      await refresh();
      Alert.alert("Membership restored");
    } catch (err) {
      Alert.alert("Restore Purchases", getIapErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    if (busy) return;
    Alert.alert("Sign Out?", "You will need to sign in again to use the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          // AppGate detects the cleared session and unmounts this screen.
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!hasEmail || busy) return;
    Alert.alert(
      "Delete Account?",
      "This will permanently delete your account and all coaching history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              const res = await fetch(
                `${getBase()}/api/users/${encodeURIComponent(email)}`,
                { method: "DELETE" },
              );
              if (!res.ok) throw new Error(`Server error ${res.status}`);
              // Scrub every app-owned key, then the profile, then sign the
              // session out. AppGate will route to LoginScreen.
              await AsyncStorage.multiRemove([
                "suxess_premium",
                "suxess_paid",
                "suxess_sessions",
                "suxess_executions",
              ]);
              await clearProfile();
              await signOut();
            } catch (err) {
              console.error("delete account error:", err);
              Alert.alert(
                "Delete Account",
                "Could not delete account. Please try again or email support@amplify-x.co.",
              );
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topInset + 8,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    backArrow: { fontSize: 18, color: colors.primary },
    headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 },
    content: { flex: 1 },
    contentInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: bottomInset + 24 },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      minHeight: 56,
    },
    rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    rowLabelWrap: { flex: 1, paddingRight: 12 },
    rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    rowRight: { flexDirection: "row", alignItems: "center" },
    rowValue: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginRight: 4 },
    chevron: { fontSize: 20, color: colors.mutedForeground, marginLeft: 2 },
    statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
    statusBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
    disabledRowText: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.primary },
    deleteWrap: { marginTop: 40, alignItems: "center", paddingVertical: 8 },
    deleteText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.destructive },
    deleteTextDisabled: { color: colors.mutedForeground },
  });

  const Chevron = () => <Text style={s.chevron}>›</Text>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentInner} showsVerticalScrollIndicator={false}>
        {/* ACCOUNT */}
        <Text style={s.sectionLabel}>Account</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Email</Text>
            </View>
            <Text style={s.rowValue} numberOfLines={1}>
              {hasEmail ? email : "Not signed in"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT STATUS — status badge + Apple Restore Purchases. The
            Status row is purely visual (no onPress, no link); Restore is
            always tappable per Apple's discoverability requirement. */}
        <Text style={s.sectionLabel}>Account Status</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Status</Text>
            </View>
            <View
              style={[
                s.statusBadge,
                { backgroundColor: isPaid ? "#f0fdf4" : colors.secondary },
              ]}
            >
              <Text style={[s.statusBadgeText, { color: isPaid ? "#059669" : colors.mutedForeground }]}>
                {isPaid ? "Active" : "Not Active"}
              </Text>
            </View>
          </View>
          <View style={s.rowDivider} />
          <TouchableOpacity
            style={s.row}
            onPress={() => void handleRestore()}
            activeOpacity={0.7}
            disabled={busy}
          >
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Restore Purchases</Text>
            </View>
            <View style={s.rowRight}>
              <Chevron />
            </View>
          </TouchableOpacity>
        </View>

        {/* SUPPORT */}
        <Text style={s.sectionLabel}>Support</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(FEEDBACK_MAILTO)} activeOpacity={0.7}>
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Send Feedback</Text>
            </View>
            <View style={s.rowRight}>
              <Chevron />
            </View>
          </TouchableOpacity>
        </View>

        {/* LEGAL */}
        <Text style={s.sectionLabel}>Legal</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(PRIVACY_URL)} activeOpacity={0.7}>
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Privacy Policy</Text>
            </View>
            <View style={s.rowRight}>
              <Chevron />
            </View>
          </TouchableOpacity>
          <View style={s.rowDivider} />
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(TERMS_URL)} activeOpacity={0.7}>
            <View style={s.rowLabelWrap}>
              <Text style={s.rowLabel}>Terms of Service</Text>
            </View>
            <View style={s.rowRight}>
              <Chevron />
            </View>
          </TouchableOpacity>
        </View>

        {/* SIGN OUT */}
        {hasEmail ? (
          <>
            <Text style={s.sectionLabel}>Session</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.row} onPress={handleSignOut} activeOpacity={0.7} disabled={busy}>
                <View style={s.rowLabelWrap}>
                  <Text style={s.signOutText}>Sign Out</Text>
                </View>
                <View style={s.rowRight}>
                  <Chevron />
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* DELETE */}
        {hasEmail ? (
          <TouchableOpacity style={s.deleteWrap} onPress={handleDelete} activeOpacity={0.7} disabled={busy}>
            <Text style={s.deleteText}>Delete My Account</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.deleteWrap}>
            <Text style={[s.deleteText, s.deleteTextDisabled]}>Delete My Account</Text>
            <Text style={[s.disabledRowText, { marginTop: 6 }]}>Sign in required</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
