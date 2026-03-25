import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCompanyStore } from '../stores/companyStore'
import { useOrderStore } from '../stores/orderStore'
import { orderService } from '../services/orderService'
import { formatMoney } from '../utils/money.utils'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'PixPayment'>

const PIX_EXPIRATION_SECONDS = 5 * 60 // 5 minutes

export const PixPaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount } = route.params
  const company = useCompanyStore((state) => state.company)
  const { clearAllOrders } = useOrderStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>()
  const [remainingSeconds, setRemainingSeconds] = useState(PIX_EXPIRATION_SECONDS)
  const [isPaid, setIsPaid] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const primaryColor = company?.baseColor || colors.primary

  // Generate PIX charge on mount
  useEffect(() => {
    const generatePix = async () => {
      try {
        setIsLoading(true)
        setError(undefined)
        const pixCharge = await orderService.createPixCharge(orderId)
        setQrCodeUrl(pixCharge.qrCodeUrl)
      } catch (err) {
        console.error('Error generating PIX:', err)
        setError('Não foi possível gerar o código PIX. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }

    generatePix()
  }, [orderId])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Poll for payment status
  useEffect(() => {
    if (!qrCodeUrl || isPaid) return

    pollingRef.current = setInterval(async () => {
      try {
        const status = await orderService.getPaymentStatus(orderId)
        if (status.status === 'completed') {
          setIsPaid(true)
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (timerRef.current) clearInterval(timerRef.current)

          // Clear orders and navigate to menu after success
          setTimeout(() => {
            clearAllOrders()
            navigation.reset({
              index: 0,
              routes: [{ name: 'Menu' }],
            })
          }, 2000)
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [qrCodeUrl, isPaid, orderId, clearAllOrders, navigation])

  const handleGoBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = remainingSeconds / PIX_EXPIRATION_SECONDS

  // Loading state - while generating PIX code
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreenContainer}>
          <Text style={styles.loadingScreenTitle}>
            Estamos gerando{'\n'}seu código PIX
          </Text>

          <ActivityIndicator
            size="large"
            color={primaryColor}
            style={styles.loadingScreenSpinner}
          />

          <Text style={styles.loadingScreenSubtitle}>
            Enquanto isso, abra o app do seu banco...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Success state - payment confirmed
  if (isPaid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Pagamento confirmado!</Text>
          <Text style={styles.successSubtitle}>Obrigado pela preferência.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Company Name Header */}
      <View style={styles.header}>
        <Text style={[styles.companyName, { color: primaryColor }]}>
          {company?.name || 'iMesa'}
        </Text>
      </View>

      {/* Main Content - Two Columns */}
      <View style={styles.content}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          <Text style={styles.title}>Finalize seu Pedido</Text>
          <Text style={styles.subtitle}>
            Pague com PIX e confirme instantaneamente.
          </Text>

          {/* Total Card */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={[styles.totalValue, { color: primaryColor }]}>
              {formatMoney(amount)}
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionRow}>
              <Ionicons name="phone-portrait-outline" size={24} color="#666666" />
              <Text style={styles.instructionText}>Abra o app do seu banco</Text>
            </View>
            <View style={styles.instructionRow}>
              <Ionicons name="qr-code-outline" size={24} color="#666666" />
              <Text style={styles.instructionText}>Escolha pagar com PIX</Text>
            </View>
            <View style={styles.instructionRow}>
              <Ionicons name="scan-outline" size={24} color="#666666" />
              <Text style={styles.instructionText}>Escaneie o código ao lado</Text>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          {/* QR Code Card */}
          <View style={styles.qrCodeCard}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: primaryColor }]}
                  onPress={() => navigation.replace('PixPayment', { orderId, amount })}
                >
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : qrCodeUrl ? (
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Timer Card */}
          <View style={styles.timerCard}>
            <Text style={styles.timerTitle}>Resta {formatTime(remainingSeconds)}</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: primaryColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.timerSubtitle}>Seu QR Code expira em breve.</Text>
          </View>
        </View>
      </View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.changeButton} onPress={handleGoBack}>
          <Text style={[styles.changeButtonText, { color: primaryColor }]}>
            Trocar forma de pagamento
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Loading Screen
  loadingScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingScreenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3D3D3D',
    textAlign: 'center',
    lineHeight: 42,
  },
  loadingScreenSpinner: {
    marginVertical: spacing.xl * 2,
    transform: [{ scale: 2 }],
  },
  loadingScreenSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: spacing.xl * 2,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 80,
    color: '#27B785',
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
  // Main Screen
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl * 2,
    gap: spacing.xl * 2,
  },
  // Left Column
  leftColumn: {
    flex: 1,
    paddingRight: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3D3D3D',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: spacing.xl,
  },
  totalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: spacing.sm,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  instructions: {
    gap: spacing.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
  },
  // Right Column
  rightColumn: {
    flex: 1,
    alignItems: 'center',
  },
  qrCodeCard: {
    width: 320,
    height: 320,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrCode: {
    width: 280,
    height: 280,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  timerCard: {
    width: 320,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D3D3D',
    marginBottom: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  // Footer
  footer: {
    paddingHorizontal: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  changeButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
