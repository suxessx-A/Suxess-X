import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface FlowButtonProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "outline";
  locked?: boolean;
}

export function FlowButton({ label, subtitle, onPress, icon, variant = "primary", locked = false }: FlowButtonProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    button: {
      borderRadius: colors.radius,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      ...(variant === "primary" && {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }),
      ...(variant === "secondary" && {
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: colors.border,
      }),
      ...(variant === "outline" && {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: colors.primary,
      }),
    },
    icon: {
      fontSize: 22,
      marginRight: 14,
      width: 28,
      textAlign: "center" as const,
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      ...(variant === "primary" && { color: colors.primaryForeground }),
      ...(variant === "secondary" && { color: colors.secondaryForeground }),
      ...(variant === "outline" && { color: colors.primary }),
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      ...(variant === "primary" && { color: "rgba(255,255,255,0.75)" }),
      ...(variant === "secondary" && { color: colors.mutedForeground }),
      ...(variant === "outline" && { color: colors.mutedForeground }),
    },
    arrow: {
      fontSize: 18,
      ...(variant === "primary" && { color: "rgba(255,255,255,0.6)" }),
      ...(variant === "secondary" && { color: colors.mutedForeground }),
      ...(variant === "outline" && { color: colors.primary }),
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {locked ? (
        <Text style={[styles.arrow, { fontSize: 14, opacity: 0.4 }]}>🔒</Text>
      ) : (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}
