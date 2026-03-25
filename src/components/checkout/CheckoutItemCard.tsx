import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../../theme'
import { formatMoney } from '../../utils/money.utils'
import { getImageUrl } from '../../services/api'
import type { CartItem } from '../../types'

interface CheckoutItemCardProps {
  item: CartItem
}

export const CheckoutItemCard: React.FC<CheckoutItemCardProps> = ({ item }) => {
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
          <Ionicons name="restaurant-outline" size={24} color={colors.textMuted} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
          <Text style={styles.quantity}>x{item.quantity}</Text>
        </View>

        {/* Additionals as chips */}
        {item.additionals.length > 0 && (
          <View style={styles.chips}>
            {item.additionals.map((addon) => (
              <View key={addon.itemId} style={styles.chip}>
                <Text style={styles.chipText}>{addon.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price */}
        <Text style={styles.price}>{formatMoney(itemTotal)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  imagePlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
