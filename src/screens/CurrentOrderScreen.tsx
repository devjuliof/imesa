import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWaiterCall } from '../hooks/useWaiterCall'
import { useCartStore } from '../stores/cartStore'
import { useOrderStore } from '../stores/orderStore'
import { useCompanyStore } from '../stores/companyStore'
import { useConfigStore } from '../stores/configStore'
import { OrderItemCard, CustomerInfoModal } from '../components/order'
import { HandIcon, BagIcon } from '../components/icons'
import { orderService } from '../services/orderService'
import { formatMoney } from '../utils/money.utils'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'
import type { CartItem, CreateOrderItem, CreateOrderPayload } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'CurrentOrder'>

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.85

export const CurrentOrderScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const company = useCompanyStore((state) => state.company)
  const companySlug = useConfigStore((state) => state.companySlug) || ''
  const tableNumber = useConfigStore((state) => state.tableNumber)
  const tableId = useConfigStore((state) => state.tableId)
  const { items, getTotal, getItemCount, updateQuantity, getItemKey, clearCart } = useCartStore()
  const { addSentOrder, sentOrders, customerName, customerPhone, setCustomerInfo } = useOrderStore()
  const [isSending, setIsSending] = useState(false)
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false)

  const slideAnim = useRef(new Animated.Value(OVERLAY_HEIGHT)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  const primaryColor = company?.baseColor || colors.primary
  const total = getTotal()
  const itemCount = getItemCount()

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
    ]).start()
  }, [])

  const animateOut = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: OVERLAY_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(callback)
  }, [fadeAnim, slideAnim])

  const { callWaiter } = useWaiterCall()
  const handleCallWaiter = useCallback(() => {
    void callWaiter()
  }, [callWaiter])

  const handleClose = useCallback(() => {
    animateOut(() => navigation.goBack())
  }, [animateOut, navigation])

  const handleEditItem = useCallback((item: CartItem) => {
    const itemKey = getItemKey(item)
    animateOut(() => {
      navigation.navigate('ProductDetail', {
        productId: item.productId,
        editingCartItemKey: itemKey,
      })
    })
  }, [animateOut, navigation, getItemKey])

  const handleIncrement = useCallback((item: CartItem) => {
    const itemKey = getItemKey(item)
    updateQuantity(itemKey, item.quantity + 1)
  }, [updateQuantity, getItemKey])

  const handleDecrement = useCallback((item: CartItem) => {
    const itemKey = getItemKey(item)
    if (item.quantity > 1) {
      updateQuantity(itemKey, item.quantity - 1)
    } else {
      Alert.alert(
        'Remover item',
        'Deseja remover este item do pedido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => updateQuantity(itemKey, 0),
          },
        ]
      )
    }
  }, [updateQuantity, getItemKey])

  const handleCancelOrder = useCallback(() => {
    Alert.alert(
      'Cancelar pedido',
      'Deseja cancelar todos os itens do pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => {
            clearCart()
            animateOut(() => navigation.navigate('Menu'))
          },
        },
      ]
    )
  }, [clearCart, animateOut, navigation])

  const proceedWithOrder = useCallback(async (name?: string, phone?: string) => {
    setIsSending(true)

    // Use passed parameters or fall back to store values
    const finalName = name || customerName
    const finalPhone = phone || customerPhone

    try {
      // Create order items for API
      const orderItems: CreateOrderItem[] = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.observations || undefined,
        additionals: item.additionals?.map((add) => ({
          id: add.itemId,
          name: add.name,
          quantity: add.quantity * item.quantity,
          priceCents: add.priceCents,
        })),
      }))

      // Clean phone number - only digits
      const cleanPhone = (finalPhone || '').replace(/\D/g, '')

      // Create order payload
      const payload: CreateOrderPayload = {
        source: 'tablet',
        deliveryType: 'dine_in',
        tableNumber: tableNumber || undefined,
        tableId: tableId || undefined,
        customerName: finalName || `Mesa ${tableNumber || 'Tablet'}`,
        customerPhone: cleanPhone,
        items: orderItems,
        paymentMethod: 'cash', // Will be updated when paying
      }

      // Call API to create order
      const order = await orderService.createOrder(companySlug, payload)

      // Add order to sent orders (comanda) with real orderId
      addSentOrder({
        id: order.id,
        items: [...items],
        totalCents: order.totalCents,
        status: 'pending',
      })

      // Clear the cart
      clearCart()

      // Navigate to confirmation screen
      animateOut(() => navigation.navigate('OrderConfirmation'))
    } catch (error) {
      console.error('Error sending order:', error)
      Alert.alert(
        'Erro ao enviar pedido',
        'Não foi possível enviar o pedido. Tente novamente.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsSending(false)
    }
  }, [items, companySlug, tableNumber, tableId, customerName, customerPhone, addSentOrder, clearCart, animateOut, navigation])

  const handleSendOrder = useCallback(() => {
    if (items.length === 0) {
      Alert.alert('Pedido vazio', 'Adicione itens ao pedido antes de enviar.')
      return
    }

    // If no customer info, show modal to collect it
    if (!customerName || !customerPhone) {
      setShowCustomerInfoModal(true)
      return
    }

    // Proceed with order
    proceedWithOrder()
  }, [items, customerName, customerPhone, proceedWithOrder])

  const handleCustomerInfoSubmit = useCallback((name: string, phone: string) => {
    setCustomerInfo(name, phone)
    setShowCustomerInfoModal(false)
    // Proceed with order, passing the new values directly to avoid stale closure
    proceedWithOrder(name, phone)
  }, [setCustomerInfo, proceedWithOrder])

  const renderItem = useCallback(({ item }: { item: CartItem }) => (
    <OrderItemCard
      item={item}
      onEdit={() => handleEditItem(item)}
      onIncrement={() => handleIncrement(item)}
      onDecrement={() => handleDecrement(item)}
      primaryColor={primaryColor}
    />
  ), [handleEditItem, handleIncrement, handleDecrement, primaryColor])

  const keyExtractor = useCallback((item: CartItem) => getItemKey(item), [getItemKey])

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
          }
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

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Sliding content */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Meu pedido</Text>
          <View style={styles.badge}>
            <BagIcon size={24} color={colors.textPrimary} />
            {itemCount > 0 && (
              <View style={[styles.badgeCount, { backgroundColor: primaryColor }]}>
                <Text style={styles.badgeCountText}>{itemCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items List */}
        <View style={styles.listContainer}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <BagIcon size={64} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>Seu pedido está vazio</Text>
              <Text style={styles.emptyStateSubtext}>
                Adicione itens do cardápio para começar
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(total)}</Text>
          </View>

          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: primaryColor },
                isSending && styles.sendButtonDisabled,
              ]}
              onPress={handleSendOrder}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendButtonText}>Enviar pedido</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Customer Info Modal */}
      <CustomerInfoModal
        visible={showCustomerInfoModal}
        onSubmit={handleCustomerInfoSubmit}
        primaryColor={primaryColor}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  floatingButtons: {
    position: 'absolute',
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 10,
  },
  waiterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  waiterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: OVERLAY_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingVertical: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#1F1F1F',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  footerTotal: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  sendButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 140,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
})
