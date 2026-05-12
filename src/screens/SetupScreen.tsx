import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, typography, borderRadius } from '../theme'
import { menuService, tableService } from '../services'
import { useConfigStore } from '../stores/configStore'
import type { RootStackParamList } from '../../App'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const SetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const [slug, setSlug] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)

  const setConfig = useConfigStore((state) => state.setConfig)
  const getOrCreateDeviceId = useConfigStore((state) => state.getOrCreateDeviceId)

  const handleSubmit = async () => {
    const trimmedSlug = slug.trim().toLowerCase()
    const trimmedTable = tableNumber.trim()

    // Reset errors
    setError(null)
    setTableError(null)

    // Validate inputs
    if (!trimmedSlug) {
      setError('Digite o identificador do restaurante')
      return
    }

    if (!trimmedTable) {
      setTableError('Digite o número da mesa')
      return
    }

    setIsLoading(true)

    try {
      // Validate slug by trying to fetch the menu
      await menuService.getPublicMenu(trimmedSlug)

      // Get or create device ID
      const deviceId = getOrCreateDeviceId()

      // Register device with the table (creates table if needed)
      const tableData = await tableService.registerDevice(trimmedSlug, {
        tableNumber: trimmedTable,
        deviceId,
      })

      // If successful, save the config with tableId
      setConfig(trimmedSlug, trimmedTable, tableData.id)
    } catch (err: unknown) {
      console.error('[SETUP] Error:', JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2))
      const error = err as { response?: { status?: number; data?: unknown }; message?: string }
      console.error('[SETUP] Status:', error.response?.status, 'Message:', error.message, 'Data:', JSON.stringify(error.response?.data))
      if (error.response?.status === 404) {
        setError('Restaurante não encontrado. Verifique o identificador.')
      } else {
        setError('Erro ao conectar. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={64} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Configurar Tablet</Text>
          <Text style={styles.subtitle}>
            Digite o identificador do restaurante para conectar este tablet ao
            cardápio.
          </Text>

          {/* Restaurant Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Identificador do Restaurante</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="ex: meu-restaurante"
              placeholderTextColor={colors.textMuted}
              value={slug}
              onChangeText={(text) => {
                setSlug(text)
                setError(null)
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              editable={!isLoading}
              returnKeyType="next"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Table Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número da Mesa</Text>
            <TextInput
              style={[styles.input, tableError && styles.inputError]}
              placeholder="ex: 15"
              placeholderTextColor={colors.textMuted}
              value={tableNumber}
              onChangeText={(text) => {
                setTableNumber(text)
                setTableError(null)
              }}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              editable={!isLoading}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
            {tableError && <Text style={styles.errorText}>{tableError}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Conectar</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.white}
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Help text */}
          <Text style={styles.helpText}>
            O identificador foi fornecido pelo administrador do sistema.
          </Text>
        </View>

        {/* Waiter Mode Button */}
        <TouchableOpacity
          style={styles.waiterModeButton}
          onPress={() => navigation.navigate('WaiterMode')}
        >
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.waiterModeButtonText}>Modo Garçom</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonIcon: {
    marginLeft: spacing.sm,
  },
  helpText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  waiterModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  waiterModeButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
})
