import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme";
import { formatMoney } from "../../utils/money.utils";
import { BagIcon } from "../icons";

interface CartFooterProps {
  itemCount: number;
  total: number;
  onPress: () => void;
  primaryColor?: string;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  itemCount,
  total,
  onPress,
  primaryColor = colors.primary,
}) => {
  const isEmpty = itemCount === 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: primaryColor }]}
      onPress={onPress}
      activeOpacity={isEmpty ? 1 : 0.8}
      disabled={isEmpty}
    >
      <View style={styles.content}>
        <BagIcon size={28} color={colors.white} />

        {isEmpty ? (
          <Text style={styles.emptyText}>Sem nenhum pedido no carrinho</Text>
        ) : (
          <>
            <View style={[styles.badge, { backgroundColor: colors.white }]}>
              <Text style={[styles.badgeText, { color: primaryColor }]}>
                {itemCount}
              </Text>
            </View>
            <Text style={styles.text}>Ver pedido</Text>
            <Text style={styles.total}>{formatMoney(total)}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.white,
  },
  text: {
    ...typography.button,
    color: colors.white,
    flex: 1,
  },
  total: {
    ...typography.price,
    color: colors.white,
  },
  badge: {
    borderRadius: borderRadius.full,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
