import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCompanyStore } from '../stores/companyStore'
import { useWaiterCallStore, type WaiterCall } from '../stores/waiterCallStore'
import { getImageUrl } from '../services/api'
import { colors, spacing, borderRadius } from '../theme'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterMode'>

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const getTimeDiff = (timestamp: string) => {
  const now = new Date()
  const callTime = new Date(timestamp)
  const diffMs = now.getTime() - callTime.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'agora'
  if (diffMins === 1) return '1 min atrás'
  return `${diffMins} min atrás`
}

export const WaiterScreen: React.FC<Props> = ({ navigation }) => {
  const company = useCompanyStore((state) => state.company)
  const { calls, acknowledgeCall, clearCall } = useWaiterCallStore()
  const [refreshing, setRefreshing] = useState(false)
  const [, setUpdateTrigger] = useState(0)

  const primaryColor = company?.baseColor || colors.primary

  // Filter pending calls only
  const pendingCalls = calls.filter((call) => call.status === 'pending')

  // Update time differences periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // In a real app, this would fetch calls from the server
    // For now, just simulate a refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleAcknowledge = useCallback(
    (callId: string) => {
      acknowledgeCall(callId)
    },
    [acknowledgeCall]
  )

  const handleDismiss = useCallback(
    (callId: string) => {
      clearCall(callId)
    },
    [clearCall]
  )

  const renderCall = useCallback(
    ({ item }: { item: WaiterCall }) => {
      const isAcknowledged = item.status === 'acknowledged'

      return (
        <View
          style={[
            styles.callCard,
            isAcknowledged && styles.callCardAcknowledged,
          ]}
        >
          <View style={styles.callInfo}>
            <View style={styles.callHeader}>
              <View style={styles.tableInfo}>
                <Ionicons
                  name="restaurant"
                  size={24}
                  color={isAcknowledged ? colors.textMuted : primaryColor}
                />
                <Text
                  style={[
                    styles.tableText,
                    isAcknowledged && styles.textMuted,
                  ]}
                >
                  Mesa {item.tableNumber}
                </Text>
              </View>

              <View
                style={[
                  styles.typeBadge,
                  item.type === 'bill'
                    ? styles.typeBadgeBill
                    : { backgroundColor: primaryColor },
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {item.type === 'bill' ? 'Conta' : 'Chamado'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.timeText,
                isAcknowledged && styles.textMuted,
              ]}
            >
              {formatTime(item.timestamp)} • {getTimeDiff(item.timestamp)}
            </Text>
          </View>

          <View style={styles.callActions}>
            {isAcknowledged ? (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(item.id)}
              >
                <Ionicons name="checkmark-done" size={24} color={colors.textMuted} />
                <Text style={styles.dismissButtonText}>Concluído</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.acknowledgeButton, { backgroundColor: primaryColor }]}
                onPress={() => handleAcknowledge(item.id)}
              >
                <Text style={styles.acknowledgeButtonText}>Atender</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )
    },
    [primaryColor, handleAcknowledge, handleDismiss]
  )

  const keyExtractor = useCallback((item: WaiterCall) => item.id, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {company?.logo ? (
            <Image
              source={{ uri: getImageUrl(company.logo) || undefined }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.headerTitle}>
              {company?.name || 'iMesa'}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.modeBadge, { backgroundColor: primaryColor }]}>
            <Ionicons name="person" size={16} color={colors.white} />
            <Text style={styles.modeBadgeText}>Garçom</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Chamados Pendentes</Text>
        <Text style={styles.subtitle}>
          {pendingCalls.length === 0
            ? 'Nenhum chamado no momento'
            : `${pendingCalls.length} chamado${pendingCalls.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Calls List */}
      <FlatList
        data={calls}
        renderItem={renderCall}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>Nenhum chamado</Text>
            <Text style={styles.emptyStateSubtext}>
              Puxe para baixo para atualizar
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#1F1F1F',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    height: 32,
    width: 120,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  callCardAcknowledged: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
  },
  callInfo: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tableText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textMuted: {
    color: colors.textMuted,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeBadgeBill: {
    backgroundColor: '#F59E0B',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  callActions: {
    marginLeft: spacing.md,
  },
  acknowledgeButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  acknowledgeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  dismissButtonText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
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
})
