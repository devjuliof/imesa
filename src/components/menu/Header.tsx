import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../../theme";
import { HandIcon } from "../icons";

const HARDCODED_LOGOS: Record<string, any> = {
  'forja-bbq': require('../../../assets/forja-bbq-logo.png'),
};

interface HeaderProps {
  logoUrl?: string | null;
  companySlug?: string;
  companyName?: string;
  tableNumber?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCallWaiter: () => void;
  primaryColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logoUrl,
  companySlug,
  companyName,
  tableNumber,
  searchQuery,
  onSearchChange,
  onCallWaiter,
  primaryColor = colors.primary,
}) => {
  const hardcodedLogo = companySlug ? HARDCODED_LOGOS[companySlug] : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {hardcodedLogo ? (
            <Image
              source={hardcodedLogo}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.companyName, { color: primaryColor }]}>
              {companyName || "iMesa"}
            </Text>
          )}
        </View>

        {/* Table Number Badge */}
        {tableNumber && (
          <View style={[styles.tableBadge, { backgroundColor: primaryColor }]}>
            <Ionicons name="restaurant-outline" size={18} color={colors.white} />
            <Text style={styles.tableBadgeText}>Mesa {tableNumber}</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Right side: Search + Waiter Button */}
        <View style={styles.rightContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por nome do prato..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            <Ionicons
              name="search-outline"
              size={22}
              color={colors.textMuted}
            />
          </View>

          {/* Call Waiter Button */}
          <TouchableOpacity
            style={[styles.waiterButton, { backgroundColor: primaryColor }]}
            onPress={onCallWaiter}
            activeOpacity={0.8}
          >
            <HandIcon size={22} color={colors.white} />
            <Text style={styles.waiterButtonText}>Chamar garçom</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E0E0E0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logoContainer: {
    height: 50,
    width: 260,
    overflow: "hidden",
  },
  logo: {
    height: 120,
    width: 260,
    marginTop: -35,
    marginLeft: -40,
  },
  companyName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tableBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginLeft: spacing.lg,
    gap: spacing.xs,
  },
  tableBadgeText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  spacer: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 52,
    width: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: colors.textPrimary,
    height: "100%",
    textAlignVertical: "center",
    paddingVertical: 0,
  },
  waiterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    height: 52,
  },
  waiterButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
