import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { colors, spacing, borderRadius } from '../../theme'

interface CustomerInfoModalProps {
  visible: boolean
  onSubmit: (name: string, phone: string) => void
  primaryColor?: string
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  visible,
  onSubmit,
  primaryColor = colors.primary,
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Clean phone to only digits for validation
  const cleanPhone = phone.replace(/\D/g, '')
  const isValid = name.trim().length > 0 && (cleanPhone.length === 10 || cleanPhone.length === 11)

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(name.trim(), phone.trim())
      // Reset fields after submit
      setName('')
      setPhone('')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Seus dados</Text>
          <Text style={styles.subtitle}>
            Informe seus dados para continuar com o pedido
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Telefone (com DDD)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="11999999999"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { borderColor: primaryColor },
              !isValid && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text
              style={[
                styles.submitButtonText,
                { color: isValid ? primaryColor : colors.textMuted },
              ]}
            >
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  submitButton: {
    height: 48,
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  submitButtonDisabled: {
    borderColor: colors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
