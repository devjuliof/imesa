import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../../theme'
import { formatMoney } from '../../utils/money.utils'

interface PixQRCodeModalProps {
  visible: boolean
  onClose: () => void
  qrCodeUrl?: string
  brCode?: string
  amount: number
  isLoading?: boolean
  error?: string
  primaryColor?: string
}

export const PixQRCodeModal: React.FC<PixQRCodeModalProps> = ({
  visible,
  onClose,
  qrCodeUrl,
  brCode,
  amount,
  isLoading = false,
  error,
  primaryColor = colors.primary,
}) => {
  const handleCopyCode = async () => {
    if (brCode) {
      await Clipboard.setStringAsync(brCode)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pagamento PIX</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={styles.loadingText}>Gerando QR Code...</Text>
              </View>
            ) : error ? (
              <View style={styles.error}>
                <Ionicons name="alert-circle" size={48} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : qrCodeUrl ? (
              <>
                {/* Amount */}
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Valor a pagar:</Text>
                  <Text style={[styles.amountValue, { color: primaryColor }]}>
                    {formatMoney(amount)}
                  </Text>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>

                {/* Instructions */}
                <Text style={styles.instructions}>
                  Escaneie o QR Code com o app do seu banco para realizar o pagamento
                </Text>

                {/* Copy code button */}
                {brCode && (
                  <TouchableOpacity
                    style={[styles.copyButton, { borderColor: primaryColor }]}
                    onPress={handleCopyCode}
                  >
                    <Ionicons name="copy-outline" size={20} color={primaryColor} />
                    <Text style={[styles.copyButtonText, { color: primaryColor }]}>
                      Copiar código PIX
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: primaryColor }]}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '90%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loading: {
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  error: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  qrContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
})
