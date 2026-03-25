import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../../theme'
import { formatMoney } from '../../utils/money.utils'
import { getImageUrl } from '../../services/api'
import type { CartItem } from '../../types'

interface OrderItemCardProps {
  item: CartItem
  onEdit: () => void
  onIncrement: () => void
  onDecrement: () => void
  primaryColor?: string
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onEdit,
  onIncrement,
  onDecrement,
  primaryColor = colors.primary,
}) => {
  const imageUrl = getImageUrl(item.imageUrl)

  // Calculate total for this item (unit price + additionals) * quantity
  const additionalsTotal = item.additionals.reduce(
    (sum, addon) => sum + addon.priceCents * addon.quantity,
    0
  )
  const itemTotal = (item.unitPrice + additionalsTotal) * item.quantity

  return (
    <View style={styles.container}>
      {/* Product Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={32} color={colors.textMuted} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={[styles.editButtonText, { color: primaryColor }]}>
              Editar item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additionals/Observations as chips */}
        <View style={styles.chips}>
          {item.additionals.map((addon) => (
            <View key={addon.itemId} style={styles.chip}>
              <Text style={styles.chipText}>{addon.name}</Text>
            </View>
          ))}
          {item.observations && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.observations}</Text>
            </View>
          )}
        </View>

        {/* Price and Quantity */}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatMoney(itemTotal)}</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={onDecrement}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              style={[styles.quantityButtonPrimary, { backgroundColor: primaryColor }]}
              onPress={onIncrement}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  imagePlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
})
