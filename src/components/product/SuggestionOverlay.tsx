import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getImageUrl } from "../../services/api";
import { formatMoney } from "../../utils/money.utils";
import { colors, spacing, borderRadius } from "../../theme";
import type { PublicProductSuggestion } from "../../types";

interface SuggestionOverlayProps {
  visible: boolean;
  suggestion: PublicProductSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  primaryColor: string;
  currentIndex: number;
  totalSuggestions: number;
}

export const SuggestionOverlay: React.FC<SuggestionOverlayProps> = ({
  visible,
  suggestion,
  onAccept,
  onDecline,
  primaryColor,
  currentIndex,
  totalSuggestions,
}) => {
  const imageUrl = getImageUrl(suggestion.imageUrl);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header with counter */}
          <View style={styles.header}>
            <Text style={styles.counterText}>
              Sugestao {currentIndex + 1} de {totalSuggestions}
            </Text>
            <Text style={styles.headerTitle}>Que tal adicionar?</Text>
          </View>

          {/* Product image */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <Ionicons
                  name="restaurant-outline"
                  size={64}
                  color={colors.textMuted}
                />
              </View>
            )}
          </View>

          {/* Product info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{suggestion.name}</Text>
            {suggestion.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {suggestion.description}
              </Text>
            )}
            <Text style={styles.productPrice}>
              {formatMoney(suggestion.price)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.acceptButton, { borderColor: primaryColor }]}
              onPress={onAccept}
            >
              <Text style={[styles.acceptButtonText, { color: primaryColor }]}>
                Adicionar {formatMoney(suggestion.price)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineButtonText}>Nao, obrigado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  counterText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  imageContainer: {
    height: 180,
    backgroundColor: "#F0F0F0",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  acceptButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  declineButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
