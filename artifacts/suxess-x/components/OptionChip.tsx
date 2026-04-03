import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function OptionChip({ label, selected, onPress, disabled = false }: OptionChipProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    chip: {
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 2,
      backgroundColor: selected ? colors.primary : disabled ? "#f9fafb" : colors.card,
      borderColor: selected ? colors.primary : disabled ? "#e5e7eb" : colors.border,
      opacity: disabled ? 0.5 : 1,
      shadowColor: selected ? colors.primary : "transparent",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: selected ? 0.2 : 0,
      shadowRadius: 6,
      elevation: selected ? 3 : 0,
    },
    label: {
      fontSize: 15,
      fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
      color: selected ? colors.primaryForeground : disabled ? "#9ca3af" : colors.foreground,
    },
  });

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
