import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCompanyStore } from '../stores/companyStore'
import { useConfigStore } from '../stores/configStore'
import { useOrderStore } from '../stores/orderStore'
import { orderService } from '../services/orderService'
import { formatMoney } from '../utils/money.utils'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'
import type { CardPaymentType, PaymentConfig } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'CardPayment'>

// Card brand detection based on number prefix
const detectCardBrand = (number: string): string => {
  const cleanNumber = number.replace(/\s/g, '')
  if (/^4/.test(cleanNumber)) return 'Visa'
  if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard'
  if (/^3[47]/.test(cleanNumber)) return 'Amex'
  if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover'
  if (/^(?:636368|636369|5067|4576|4011)/.test(cleanNumber)) return 'Elo'
  if (/^606282/.test(cleanNumber)) return 'Hipercard'
  return ''
}

// Format card number with spaces
const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/\D/g, '')
  const parts = []
  for (let i = 0; i < v.length && i < 16; i += 4) {
    parts.push(v.substring(i, i + 4))
  }
  return parts.join(' ')
}

export const CardPaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount, paymentType } = route.params
  const company = useCompanyStore((state) => state.company)
  const companySlug = useConfigStore((state) => state.companySlug)
  const { clearAllOrders } = useOrderStore()

  const primaryColor = company?.baseColor || colors.primary
  const isCredit = paymentType === 'credit_card'

  // Form state
  const [cardNumber, setCardNumber] = useState('')
  const [holderName, setHolderName] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  // UI state
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)

  const cardBrand = detectCardBrand(cardNumber)

  // Load payment config on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!companySlug) return

      try {
        setIsLoadingConfig(true)
        const config = await orderService.getPaymentConfig(companySlug)
        setPaymentConfig(config)
      } catch (err) {
        console.error('Error loading payment config:', err)
        setError('Nao foi possivel carregar as configuracoes de pagamento.')
      } finally {
        setIsLoadingConfig(false)
      }
    }

    loadConfig()
  }, [companySlug])

  // Calculate installment options
  const getInstallmentOptions = useCallback(() => {
    if (!paymentConfig || !isCredit) return [{ value: 1, label: '1x (a vista)' }]

    const options = []
    const maxInstallments = paymentConfig.creditInstallmentsMax
    const minInstallmentValue = paymentConfig.creditMinInstallmentCents

    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = Math.floor(amount / i)
      if (installmentValue >= minInstallmentValue) {
        options.push({
          value: i,
          label: i === 1 ? '1x (a vista)' : `${i}x de ${formatMoney(installmentValue)}`,
        })
      }
    }

    return options.length > 0 ? options : [{ value: 1, label: '1x (a vista)' }]
  }, [paymentConfig, isCredit, amount])

  const installmentOptions = getInstallmentOptions()

  // Form validation
  const isFormValid = useCallback(() => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    return (
      cleanNumber.length >= 13 &&
      cleanNumber.length <= 19 &&
      holderName.trim().length >= 3 &&
      expMonth.length === 2 &&
      parseInt(expMonth, 10) >= 1 &&
      parseInt(expMonth, 10) <= 12 &&
      expYear.length === 2 &&
      cvv.length >= 3 &&
      cvv.length <= 4
    )
  }, [cardNumber, holderName, expMonth, expYear, cvv])

  const handleGoBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSubmit = useCallback(async () => {
    if (!isFormValid() || !paymentConfig?.pagarmePublicKey) {
      setError('Preencha todos os campos corretamente')
      return
    }

    try {
      setIsProcessing(true)
      setError(undefined)

      // Tokenize card with Pagar.me
      const token = await orderService.tokenizeCard(paymentConfig.pagarmePublicKey, {
        number: cardNumber,
        holderName,
        expMonth,
        expYear,
        cvv,
      })

      // Create charge with our backend
      const charge = await orderService.createCardCharge({
        orderId,
        cardToken: token,
        paymentType,
        installments: isCredit ? installments : 1,
      })

      if (charge.status === 'paid') {
        setIsPaid(true)
        // Clear orders and navigate to menu after success
        setTimeout(() => {
          clearAllOrders()
          navigation.reset({
            index: 0,
            routes: [{ name: 'Menu' }],
          })
        }, 2000)
      } else if (charge.status === 'pending') {
        setError('Pagamento em processamento. Voce sera notificado quando for confirmado.')
      } else {
        setError('Pagamento nao autorizado. Verifique os dados do cartao.')
      }
    } catch (err) {
      console.error('Error processing card payment:', err)
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }, [
    isFormValid,
    paymentConfig,
    cardNumber,
    holderName,
    expMonth,
    expYear,
    cvv,
    orderId,
    paymentType,
    isCredit,
    installments,
    clearAllOrders,
    navigation,
  ])

  // Loading state
  if (isLoadingConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Success state
  if (isPaid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: '#27B785' }]}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Pagamento confirmado!</Text>
          <Text style={styles.successSubtitle}>Obrigado pela preferencia.</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Card not enabled state
  if (!paymentConfig?.cardEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Indisponivel</Text>
          <Text style={styles.errorText}>
            Pagamento com cartao nao esta disponivel para este estabelecimento.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: primaryColor }]}
            onPress={handleGoBack}
          >
            <Text style={[styles.backButtonText, { color: primaryColor }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.companyName, { color: primaryColor }]}>
            {company?.name || 'iMesa'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>
            {isCredit ? 'Cartao de Credito' : 'Cartao de Debito'}
          </Text>
          <Text style={styles.subtitle}>
            Preencha os dados do seu cartao para finalizar o pagamento.
          </Text>

          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Valor a pagar</Text>
            <Text style={[styles.amountValue, { color: primaryColor }]}>
              {formatMoney(amount)}
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="card-outline" size={24} color={primaryColor} />
              <Text style={styles.formHeaderTitle}>Dados do Cartao</Text>
              {cardBrand && (
                <Text style={styles.cardBrand}>{cardBrand}</Text>
              )}
            </View>

            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numero do cartao</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.textMuted}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                maxLength={19}
                keyboardType="numeric"
                autoComplete="cc-number"
              />
            </View>

            {/* Holder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome no cartao</Text>
              <TextInput
                style={styles.input}
                placeholder="NOME COMO ESTA NO CARTAO"
                placeholderTextColor={colors.textMuted}
                value={holderName}
                onChangeText={(text) => setHolderName(text.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="cc-name"
              />
            </View>

            {/* Expiry and CVV Row */}
            <View style={styles.rowInputs}>
              <View style={styles.rowInputGroup}>
                <Text style={styles.inputLabel}>Validade</Text>
                <View style={styles.expiryRow}>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="MM"
                    placeholderTextColor={colors.textMuted}
                    value={expMonth}
                    onChangeText={(text) => setExpMonth(text.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    keyboardType="numeric"
                    autoComplete="cc-exp-month"
                  />
                  <Text style={styles.expirySeparator}>/</Text>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="AA"
                    placeholderTextColor={colors.textMuted}
                    value={expYear}
                    onChangeText={(text) => setExpYear(text.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    keyboardType="numeric"
                    autoComplete="cc-exp-year"
                  />
                </View>
              </View>

              <View style={styles.rowInputGroup}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={[styles.input, styles.cvvInput]}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  keyboardType="numeric"
                  secureTextEntry
                  autoComplete="cc-csc"
                />
              </View>
            </View>

            {/* Installments (credit only) */}
            {isCredit && installmentOptions.length > 1 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Parcelas</Text>
                <View style={styles.installmentsContainer}>
                  {installmentOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.installmentOption,
                        installments === opt.value && {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}10`,
                        },
                      ]}
                      onPress={() => setInstallments(opt.value)}
                    >
                      <Text
                        style={[
                          styles.installmentText,
                          installments === opt.value && { color: primaryColor },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            <Text style={styles.securityText}>
              Seus dados sao protegidos com criptografia
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorMessage}>
              <Text style={styles.errorMessageText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isFormValid() && !isProcessing ? primaryColor : colors.border },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name={isCredit ? 'card-outline' : 'checkmark-circle-outline'}
                  size={24}
                  color={colors.white}
                />
                <Text style={styles.submitButtonText}>
                  {isCredit && installments > 1
                    ? `Pagar ${installments}x de ${formatMoney(Math.floor(amount / installments))}`
                    : `Pagar ${formatMoney(amount)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3D3D3D',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3D3D3D',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  headerBackButton: {
    padding: spacing.sm,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3D3D3D',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: spacing.xl,
  },
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: spacing.sm,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D3D3D',
    flex: 1,
  },
  cardBrand: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowInputGroup: {
    flex: 1,
    marginBottom: spacing.md,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallInput: {
    flex: 1,
    textAlign: 'center',
  },
  expirySeparator: {
    fontSize: 20,
    color: '#666666',
    marginHorizontal: spacing.sm,
  },
  cvvInput: {
    textAlign: 'center',
  },
  installmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  installmentOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  installmentText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  errorMessage: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMessageText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
})
