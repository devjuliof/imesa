import React, { useCallback, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useOrderStore } from '../stores/orderStore'
import { useCompanyStore } from '../stores/companyStore'
import { CheckoutItemCard } from '../components/checkout'
import { HandIcon } from '../components/icons'
import { getImageUrl } from '../services/api'
import { formatMoney } from '../utils/money.utils'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'
import type { CartItem } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isValidUUID = (id: string): boolean => UUID_REGEX.test(id)

export const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const company = useCompanyStore((state) => state.company)
  const { getAllItems, getComandaTotal, clearAllOrders, getOrderIds, sentOrders } = useOrderStore()

  const primaryColor = company?.baseColor || colors.primary
  const items = useMemo(() => getAllItems(), [getAllItems])
  const total = useMemo(() => getComandaTotal(), [getComandaTotal])

  // Check for and clear invalid orders (orders with non-UUID IDs from before backend integration)
  useEffect(() => {
    const orderIds = getOrderIds()
    const hasInvalidOrders = orderIds.some((id) => !isValidUUID(id))

    if (hasInvalidOrders && orderIds.length > 0) {
      Alert.alert(
        'Pedidos inválidos',
        'Foram encontrados pedidos antigos que não foram enviados corretamente. Eles serão removidos.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearAllOrders()
              navigation.navigate('Menu')
            },
          },
        ]
      )
    }
  }, [sentOrders, getOrderIds, clearAllOrders, navigation])

  const handleGoBack = useCallback(() => {
    navigation.navigate('Menu')
  }, [navigation])

  const handleCallWaiter = useCallback(() => {
    Alert.alert(
      'Chamar Garçom',
      'Um garçom será notificado e virá até sua mesa em breve.',
      [{ text: 'OK' }]
    )
  }, [])

  const handleCreditPayment = useCallback(() => {
    Alert.alert(
      'Em breve',
      'Pagamento por cartão de crédito estará disponível em breve.',
      [{ text: 'OK' }]
    )
  }, [])

  const handleDebitPayment = useCallback(() => {
    Alert.alert(
      'Em breve',
      'Pagamento por cartão de débito estará disponível em breve.',
      [{ text: 'OK' }]
    )
  }, [])

  const handlePixPayment = useCallback(() => {
    const orderIds = getOrderIds()
    const validOrderIds = orderIds.filter(isValidUUID)

    if (validOrderIds.length === 0) {
      Alert.alert(
        'Sem pedidos válidos',
        'Não há pedidos válidos para pagar. Por favor, faça um novo pedido.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearAllOrders()
              navigation.navigate('Menu')
            },
          },
        ]
      )
      return
    }

    // Navigate to PIX payment screen with the first valid order ID
    navigation.navigate('PixPayment', {
      orderId: validOrderIds[0],
      amount: total,
    })
  }, [getOrderIds, clearAllOrders, navigation, total])

  const renderItem = useCallback(({ item }: { item: CartItem }) => (
    <CheckoutItemCard item={item} />
  ), [])

  const keyExtractor = useCallback(
    (item: CartItem, index: number) => `${item.productId}-${index}`,
    []
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>Fazer mais pedidos</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {company?.logo ? (
            <Image
              source={{ uri: getImageUrl(company.logo) || undefined }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.companyName, { color: primaryColor }]}>
              {company?.name || 'iMesa'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.waiterButton}
          onPress={handleCallWaiter}
        >
          <HandIcon size={20} color={primaryColor} />
          <Text style={[styles.waiterButtonText, { color: primaryColor }]}>
            Chamar garçom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Revisar pedidos</Text>
      </View>

      {/* Items List */}
      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>Nenhum pedido realizado</Text>
            <Text style={styles.emptyStateSubtext}>
              Seus pedidos enviados aparecerão aqui
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

        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Fechar comanda:</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleCreditPayment}
            >
              <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.paymentButtonText}>Crédito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleDebitPayment}
            >
              <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.paymentButtonText}>Débito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentButtonPrimary, { backgroundColor: primaryColor }]}
              onPress={handlePixPayment}
            >
              <Text style={styles.paymentButtonPrimaryText}>PIX</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    height: 40,
    width: 160,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
  },
  waiterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  waiterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTotal: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentSection: {
    alignItems: 'flex-end',
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  paymentButtonPrimary: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  paymentButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
})
