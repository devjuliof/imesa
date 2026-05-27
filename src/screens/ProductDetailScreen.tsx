import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProduct } from "../hooks/useMenu";
import { useWaiterCall } from "../hooks/useWaiterCall";
import { useCartStore } from "../stores/cartStore";
import { useCompanyStore } from "../stores/companyStore";
import { useConfigStore } from "../stores/configStore";
import { AddonGroup, StepIndicator, SuggestionOverlay } from "../components/product";
import { HandIcon } from "../components/icons";
import { getImageUrl } from "../services/api";
import { formatMoney } from "../utils/money.utils";
import { colors, spacing, borderRadius } from "../theme";
import type { RootStackParamList } from "../../App";
import type { PublicAddonItem, CartItemAdditional, CartItem, PublicProductSuggestion } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// Fixed height for the overlay - leaves space for floating buttons at top
const FLOATING_BUTTONS_HEIGHT = 80;

interface SelectedAddon {
  groupId: string;
  itemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, editingCartItemKey } = route.params;
  const insets = useSafeAreaInsets();
  const companySlug = useConfigStore((state) => state.companySlug) || "";
  const company = useCompanyStore((state) => state.company);
  const { addItem, removeItem, items } = useCartStore();

  const { product, isLoading } = useProduct(companySlug, productId);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Suggestion modal state
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<CartItem[]>([]);

  // Load existing item data when editing
  useEffect(() => {
    if (editingCartItemKey && product && !isInitialized) {
      const existingItem = items.find((item) => {
        const key = `${item.productId}${item.additionals?.length ? '::' + item.additionals.map(a => a.itemId).sort().join('|') : ''}`;
        return key === editingCartItemKey;
      });

      if (existingItem) {
        setQuantity(existingItem.quantity);

        // Convert cart additionals to selected addons format
        if (existingItem.additionals && existingItem.additionals.length > 0) {
          const addons: SelectedAddon[] = existingItem.additionals.map((additional) => {
            // Find which group this addon belongs to
            const group = product.addonGroups?.find((g) =>
              g.items.some((i) => i.id === additional.itemId)
            );
            return {
              groupId: group?.id || '',
              itemId: additional.itemId,
              name: additional.name,
              priceCents: additional.priceCents,
              quantity: additional.quantity,
            };
          });
          setSelectedAddons(addons);
        }
      }
      setIsInitialized(true);
    }
  }, [editingCartItemKey, product, items, isInitialized]);

  // Calculate overlay height leaving space for floating buttons
  const overlayHeight = SCREEN_HEIGHT - insets.top - FLOATING_BUTTONS_HEIGHT;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const primaryColor = company?.baseColor || colors.primary;
  const imageUrl = getImageUrl(product?.imageUrl);

  const addonGroups = product?.addonGroups || [];
  const totalSteps = addonGroups.length;
  const currentGroup = addonGroups[currentStep];

  const currentSuggestion = useMemo((): PublicProductSuggestion | null => {
    if (!product?.suggestions || product.suggestions.length === 0) return null;
    return product.suggestions[currentSuggestionIndex] ?? null;
  }, [product?.suggestions, currentSuggestionIndex]);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateOut = useCallback(
    (callback: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    [fadeAnim, slideAnim],
  );

  const handleSelectItem = useCallback(
    (item: PublicAddonItem) => {
      if (!currentGroup) return;

      const isSingleSelection = currentGroup.maxSelections === 1;

      setSelectedAddons((prev) => {
        const isAlreadySelected = prev.some(
          (s) => s.groupId === currentGroup.id && s.itemId === item.id,
        );

        if (isAlreadySelected) {
          return prev.filter(
            (s) => !(s.groupId === currentGroup.id && s.itemId === item.id),
          );
        }

        if (isSingleSelection) {
          const filtered = prev.filter((s) => s.groupId !== currentGroup.id);
          return [
            ...filtered,
            {
              groupId: currentGroup.id,
              itemId: item.id,
              name: item.name,
              priceCents: item.priceCents,
              quantity: 1,
            },
          ];
        }

        const groupSelections = prev.filter(
          (s) => s.groupId === currentGroup.id,
        );
        if (groupSelections.length >= currentGroup.maxSelections) {
          Alert.alert(
            "Limite atingido",
            `Você pode selecionar no máximo ${currentGroup.maxSelections} itens.`,
          );
          return prev;
        }

        return [
          ...prev,
          {
            groupId: currentGroup.id,
            itemId: item.id,
            name: item.name,
            priceCents: item.priceCents,
            quantity: 1,
          },
        ];
      });
    },
    [currentGroup],
  );

  const validateCurrentStep = useCallback(() => {
    if (!currentGroup) return true;

    if (currentGroup.isRequired) {
      const groupSelections = selectedAddons.filter(
        (s) => s.groupId === currentGroup.id,
      );
      if (groupSelections.length < currentGroup.minSelections) {
        Alert.alert(
          "Seleção obrigatória",
          `Selecione pelo menos ${currentGroup.minSelections} item(s) para continuar.`,
        );
        return false;
      }
    }
    return true;
  }, [currentGroup, selectedAddons]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const additionals: CartItemAdditional[] = selectedAddons.map((addon) => ({
      itemId: addon.itemId,
      name: addon.name,
      priceCents: addon.priceCents,
      quantity: addon.quantity,
    }));

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity,
      observations: observations.trim(),
      additionals,
    };

    // Check if product has suggestions
    if (product.suggestions && product.suggestions.length > 0) {
      // If editing, remove the old item first
      if (editingCartItemKey) {
        removeItem(editingCartItemKey);
      }
      setPendingCartItem(cartItem);
      setCurrentSuggestionIndex(0);
      setAcceptedSuggestions([]);
      setShowSuggestionModal(true);
    } else {
      // No suggestions, add directly
      if (editingCartItemKey) {
        removeItem(editingCartItemKey);
      }
      addItem(cartItem);
      animateOut(() => navigation.goBack());
    }
  }, [product, selectedAddons, quantity, observations, addItem, removeItem, editingCartItemKey, animateOut, navigation]);

  const handleNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleAddToCart();
    }
  }, [currentStep, totalSteps, validateCurrentStep, handleAddToCart]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const finishSuggestionFlow = useCallback((finalAcceptedSuggestions: CartItem[]) => {
    // Add pending item
    if (pendingCartItem) addItem(pendingCartItem);
    // Add all accepted suggestions
    finalAcceptedSuggestions.forEach((s) => addItem(s));
    setShowSuggestionModal(false);
    animateOut(() => navigation.goBack());
  }, [pendingCartItem, addItem, animateOut, navigation]);

  const handleAcceptSuggestion = useCallback(() => {
    if (!currentSuggestion || !product) return;

    const suggestionCartItem: CartItem = {
      productId: currentSuggestion.id,
      productName: currentSuggestion.name,
      imageUrl: currentSuggestion.imageUrl,
      unitPrice: currentSuggestion.price,
      quantity: 1,
      observations: "",
      additionals: [],
    };

    if (currentSuggestion.hasRequiredAddons) {
      // Add pending item and accepted suggestions first
      if (pendingCartItem) addItem(pendingCartItem);
      acceptedSuggestions.forEach((s) => addItem(s));

      // Navigate to suggestion product detail page
      setShowSuggestionModal(false);
      navigation.replace("ProductDetail", { productId: currentSuggestion.id });
    } else {
      // Check if this is the last suggestion
      const suggestions = product.suggestions ?? [];
      const newAcceptedSuggestions = [...acceptedSuggestions, suggestionCartItem];

      if (currentSuggestionIndex < suggestions.length - 1) {
        setAcceptedSuggestions(newAcceptedSuggestions);
        setCurrentSuggestionIndex((i) => i + 1);
      } else {
        // Last suggestion - finish flow
        finishSuggestionFlow(newAcceptedSuggestions);
      }
    }
  }, [currentSuggestion, product, pendingCartItem, acceptedSuggestions, currentSuggestionIndex, addItem, navigation, finishSuggestionFlow]);

  const handleDeclineSuggestion = useCallback(() => {
    const suggestions = product?.suggestions ?? [];
    if (currentSuggestionIndex < suggestions.length - 1) {
      setCurrentSuggestionIndex((i) => i + 1);
    } else {
      // Last suggestion - finish flow
      finishSuggestionFlow(acceptedSuggestions);
    }
  }, [product?.suggestions, currentSuggestionIndex, acceptedSuggestions, finishSuggestionFlow]);

  const { callWaiter } = useWaiterCall();
  const handleCallWaiter = useCallback(() => {
    void callWaiter();
  }, [callWaiter]);

  const handleClose = useCallback(() => {
    animateOut(() => navigation.goBack());
  }, [animateOut, navigation]);

  const subtotal = useMemo(() => {
    if (!product) return 0;
    const productTotal = product.price * quantity;
    const addonsTotal = selectedAddons.reduce(
      (sum, addon) => sum + addon.priceCents * addon.quantity,
      0,
    );
    return productTotal + addonsTotal;
  }, [product, quantity, selectedAddons]);

  const selectedItemsForCurrentGroup = useMemo(() => {
    if (!currentGroup) return [];
    return selectedAddons
      .filter((s) => s.groupId === currentGroup.id)
      .map((s) => ({ itemId: s.itemId, quantity: s.quantity }));
  }, [currentGroup, selectedAddons]);

  const buttonText = useMemo(() => {
    const actionText = editingCartItemKey ? "Atualizar pedido" : "Adicionar ao pedido";
    if (totalSteps === 0) {
      return actionText;
    }
    if (currentStep < totalSteps - 1) {
      return "Próximo passo";
    }
    return actionText;
  }, [currentStep, totalSteps, editingCartItemKey]);

  return (
    <View style={styles.container}>
      {/* Dark overlay background */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Floating buttons at top */}
      <Animated.View
        style={[
          styles.floatingButtons,
          {
            opacity: fadeAnim,
            top: insets.top + spacing.md,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.waiterButton}
          onPress={handleCallWaiter}
        >
          <HandIcon size={20} color={primaryColor} />
          <Text style={[styles.waiterButtonText, { color: primaryColor }]}>
            Chamar garçom
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Sliding content */}
      <Animated.View
        style={[
          styles.content,
          {
            height: overlayHeight,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {isLoading || !product ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <>
            {/* Main content */}
            <View style={styles.mainContent}>
              {/* Left side - Product info */}
              <View style={styles.leftSide}>
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

                <Text style={styles.productName}>{product.name}</Text>
                {product.description && (
                  <Text style={styles.productDescription}>
                    {product.description}
                  </Text>
                )}
              </View>

              {/* Right side - Addons + Observations */}
              <View style={styles.rightSide}>
                {totalSteps > 0 && currentGroup ? (
                  <>
                    <View style={styles.stepHeader}>
                      <View>
                        <Text style={styles.stepTitle}>
                          {currentGroup.name}
                        </Text>
                        <Text style={styles.stepSubtitle}>
                          {currentGroup.isRequired
                            ? currentGroup.maxSelections === 1
                              ? "Escolha apenas 1 item"
                              : `Escolha de ${currentGroup.minSelections} a ${currentGroup.maxSelections} itens`
                            : currentGroup.maxSelections === 1
                              ? "Escolha até 1 item (opcional)"
                              : `Escolha até ${currentGroup.maxSelections} itens (opcional)`}
                        </Text>
                      </View>
                      <StepIndicator
                        currentStep={currentStep + 1}
                        totalSteps={totalSteps}
                      />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      <AddonGroup
                        group={currentGroup}
                        selectedItems={selectedItemsForCurrentGroup}
                        onSelectItem={handleSelectItem}
                        primaryColor={primaryColor}
                      />

                      {/* Observations - shown on last step */}
                      {currentStep === totalSteps - 1 && (
                        <View style={styles.observationsSection}>
                          <Text style={styles.observationsLabel}>Observações</Text>
                          <TextInput
                            style={styles.observationsInput}
                            placeholder="Ex: sem cebola, ponto da carne..."
                            placeholderTextColor={colors.textMuted}
                            value={observations}
                            onChangeText={setObservations}
                            maxLength={180}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                        </View>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.observationsSection}>
                      <Text style={styles.observationsLabel}>Observações</Text>
                      <TextInput
                        style={styles.observationsInput}
                        placeholder="Ex: sem cebola, ponto da carne..."
                        placeholderTextColor={colors.textMuted}
                        value={observations}
                        onChangeText={setObservations}
                        maxLength={180}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handlePreviousStep}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.backButtonText}>Voltar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.footerCenter}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
                <Text style={styles.subtotalValue}>
                  {formatMoney(subtotal)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.nextButton, { borderColor: primaryColor }]}
                onPress={handleNextStep}
              >
                <Text style={[styles.nextButtonText, { color: primaryColor }]}>
                  {buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Suggestion Modal */}
      {currentSuggestion && (
        <SuggestionOverlay
          visible={showSuggestionModal}
          suggestion={currentSuggestion}
          onAccept={handleAcceptSuggestion}
          onDecline={handleDeclineSuggestion}
          primaryColor={primaryColor}
          currentIndex={currentSuggestionIndex}
          totalSuggestions={product?.suggestions?.length ?? 0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  floatingButtons: {
    position: "absolute",
    right: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    zIndex: 10,
  },
  waiterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  waiterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  leftSide: {
    width: "40%",
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  productImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  rightSide: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  observationsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  observationsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  observationsInput: {
    backgroundColor: "#F7F7F8",
    color: colors.textPrimary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: "#1F1F1F",
  },
  footerLeft: {
    width: 120,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.white,
  },
  footerCenter: {
    flex: 1,
    alignItems: "flex-start",
  },
  subtotalLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
  },
  subtotalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
  },
  nextButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
