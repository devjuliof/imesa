import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCompanyStore } from '../stores/companyStore'
import { colors, spacing, borderRadius } from '../theme'

interface SessionClosedScreenProps {
  onDismiss: () => void
}

/**
 * Full-screen overlay shown when the session (comanda) for this table is closed
 * by the admin/garcom. Informs the customer and resets to the menu.
 */
export const SessionClosedScreen: React.FC<SessionClosedScreenProps> = ({ onDismiss }) => {
  const company = useCompanyStore((state) => state.company)
  const primaryColor = company?.baseColor || colors.primary

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: primaryColor + '15' }]}>
            <Ionicons name="checkmark-circle" size={80} color={primaryColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Comanda encerrada!</Text>

          {/* Description */}
          <Text style={styles.description}>
            Sua comanda foi encerrada. Obrigado pela visita!
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleDismiss}
          >
            <Text style={styles.buttonText}>Novo atendimento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 32,
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl * 3,
    alignItems: 'center',
    minWidth: 500,
    maxWidth: 700,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl * 1.5,
    lineHeight: 28,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 250,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
})
