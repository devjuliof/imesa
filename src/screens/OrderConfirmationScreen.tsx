import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCompanyStore } from '../stores/companyStore'
import { ConfirmedIcon } from '../components/icons'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>

export const OrderConfirmationScreen: React.FC<Props> = ({ navigation }) => {
  const company = useCompanyStore((state) => state.company)
  const primaryColor = company?.baseColor || colors.primary

  const handleNewOrder = useCallback(() => {
    navigation.navigate('Menu')
  }, [navigation])

  const handleCallWaiter = useCallback(() => {
    Alert.alert(
      'Garçom chamado',
      'Um garçom foi notificado e virá até sua mesa em breve.',
      [{ text: 'OK' }]
    )
  }, [])

  const handleCloseTab = useCallback(() => {
    navigation.navigate('Checkout')
  }, [navigation])

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.content}>
        {/* Modal Card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>Pedido enviado para</Text>
          <Text style={styles.title}>a cozinha!</Text>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <ConfirmedIcon size={140} />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Seu pedido está sendo preparado...
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={handleNewOrder}
            >
              <Text style={styles.buttonText}>Novo pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.darkButton]}
              onPress={handleCallWaiter}
            >
              <Text style={styles.buttonText}>Chamar o garçom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.darkButton]}
              onPress={handleCloseTab}
            >
              <Text style={styles.buttonText}>Fechar comanda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    minWidth: 700,
    maxWidth: 800,
  },
  iconContainer: {
    marginVertical: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl * 1.5,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 180,
  },
  darkButton: {
    backgroundColor: '#333333',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
})
