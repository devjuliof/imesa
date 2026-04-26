import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native'
import { ProductCard } from './ProductCard'
import { colors, spacing } from '../../theme'
import type { PublicProduct } from '../../types'

const SIDEBAR_WIDTH = 160
const GRID_PADDING = 40
const GAP = 24
const NUM_COLUMNS = 3

interface ProductGridProps {
  products: PublicProduct[]
  categoryName: string
  onProductPress: (productId: string) => void
  onAddToCart: (product: PublicProduct) => void
  primaryColor?: string
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categoryName,
  onProductPress,
  onAddToCart,
  primaryColor,
}) => {
  const { width } = useWindowDimensions()
  const flatListRef = useRef<FlatList>(null)

  // Reset scroll when category changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [categoryName])
  const availableWidth = width - SIDEBAR_WIDTH - GRID_PADDING * 2
  const cardWidth = (availableWidth - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  const renderProduct = ({ item }: { item: PublicProduct }) => (
    <View style={{ width: cardWidth }}>
      <ProductCard
        product={item}
        onPress={() => onProductPress(item.id)}
        onAddToCart={() => onAddToCart(item)}
        primaryColor={primaryColor}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.categoryTitle}>{categoryName}</Text>

      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={[styles.row, { gap: GAP }]}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.lg,
    backgroundColor: colors.white,
  },
  categoryTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  gridContent: {
    paddingBottom: 120,
  },
  row: {
    marginBottom: GAP,
  },
})
