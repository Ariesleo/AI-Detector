// Shared primitives for the Veritas design system.
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette, radius, space, type as t } from "@/lib/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[styles.inner, { paddingTop: insets.top + space.l }, style]}>{children}</View>
  );
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={t.h1}>{title}</Text>
        {subtitle ? <Text style={[t.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  tint,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tint?: [string, string];
}) {
  if (tint) {
    return (
      <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, style]}>
        {children}
      </LinearGradient>
    );
  }
  return <View style={[styles.card, styles.cardSolid, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={[t.label, { marginTop: space.l, marginBottom: space.s }]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  busy,
  color,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  color?: string;
}) {
  const c = color ?? (variant === "danger" ? palette.danger : palette.accent);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && { backgroundColor: c },
        variant !== "primary" && { borderWidth: 1.5, borderColor: variant === "danger" ? palette.danger : palette.strokeBright },
        (disabled || busy) && { opacity: 0.35 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === "primary" ? palette.bg : c} />
      ) : (
        <View style={styles.btnRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={17}
              color={variant === "primary" ? palette.bg : variant === "danger" ? palette.danger : palette.text}
            />
          )}
          <Text
            style={[
              styles.btnText,
              { color: variant === "primary" ? palette.bg : variant === "danger" ? palette.danger : palette.text },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  color = palette.textDim,
  icon,
}: {
  label: string;
  color?: string;
  icon?: IconName;
}) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      {icon && <Ionicons name={icon} size={11} color={color} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={palette.textFaint} />
      </View>
      <Text style={[t.h2, { textAlign: "center" }]}>{title}</Text>
      <Text style={[t.body, { textAlign: "center" }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 110 },
  inner: {
    flex: 1,
    paddingHorizontal: space.l,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  header: { flexDirection: "row", alignItems: "center", gap: space.m, marginBottom: space.l },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: palette.bgGlass,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.l,
  },
  cardSolid: { backgroundColor: palette.bgRaised },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: space.l,
    borderRadius: radius.m,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontWeight: "700", fontSize: 15.5 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", gap: space.s, paddingVertical: space.xxl, paddingHorizontal: space.l },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: palette.bgGlass,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.s,
  },
});
