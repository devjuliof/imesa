import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../../theme'
import { formatMoney } from '../../utils/money.utils'

interface AddonOptionProps {
  id: string
  name: string
  priceCents: number
  isSelected: boolean
  onSelect: () => void
  selectionType: 'single' | 'multiple'
  primaryColor?: string
}

export const AddonOption: React.FC<AddonOptionProps> = ({
  name,
  priceCents,
  isSelected,
  onSelect,
  selectionType,
  primaryColor = colors.primary,
}) => {
  const iconName = selectionType === 'single'
    ? isSelected ? 'radio-button-on' : 'radio-button-off'
    : isSelected ? 'checkbox' : 'square-outline'

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {priceCents > 0 && (
          <Text style={styles.price}>+ {formatMoney(priceCents)}</Text>
        )}
      </View>
      <Ionicons
        name={iconName}
        size={24}
        color={isSelected ? primaryColor : colors.textMuted}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  price: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
})
