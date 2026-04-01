import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const colors = useColors();
  const progress = Math.min(current / total, 1);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    count: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    track: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: colors.primary,
      width: `${progress * 100}%`,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {label ? <Text style={styles.label}>{label}</Text> : <View />}
        <Text style={styles.count}>{current} of {total}</Text>
      </View>
      <View style={styles.track}>
        <View style={styles.fill} />
      </View>
    </View>
  );
}
