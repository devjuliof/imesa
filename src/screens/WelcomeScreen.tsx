import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../App'
import { useConfigStore } from '../stores/configStore'
import { useCompanyStore } from '../stores/companyStore'
import { tableService } from '../services/tableService'
import { colors, spacing } from '../theme'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const companySlug = useConfigStore((state) => state.companySlug) || ''
  const tableId = useConfigStore((state) => state.tableId) || ''
  const company = useCompanyStore((state) => state.company)
  const [loading, setLoading] = useState(false)

  const primaryColor = company?.baseColor || colors.primary

  const handleStartOrder = async () => {
    if (loading) return
    setLoading(true)
    try {
      await tableService.startSession(companySlug, tableId)
      navigation.navigate('Menu')
    } catch (error) {
      if (__DEV__) {
        console.log('[WelcomeScreen] Failed to start session:', error)
      }
      // Navigate anyway so the customer isn't stuck
      navigation.navigate('Menu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {company?.logo && (
          <Image
            source={{ uri: company.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <Text style={styles.heading}>Bem-vindo!</Text>
        {company?.name && (
          <Text style={styles.companyName}>{company.name}</Text>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={handleStartOrder}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>Iniciar pedido</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  companyName: {
    fontSize: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xl * 2,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
})
