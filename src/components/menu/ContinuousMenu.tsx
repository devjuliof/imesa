import React, { useRef, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native'
import { ProductCard } from './ProductCard'
import { colors, spacing } from '../../theme'
import type { PublicCategory, PublicProduct } from '../../types'

const SIDEBAR_WIDTH = 160
const GRID_PADDING = 40
const GAP = 24
const NUM_COLUMNS = 2

interface ContinuousMenuProps {
  categories: PublicCategory[]
  searchQuery?: string
  onProductPress: (productId: string) => void
  onAddToCart: (product: PublicProduct) => void
  onCategoryVisible: (categoryId: string) => void
  primaryColor?: string
}

export interface ContinuousMenuRef {
  scrollToCategory: (categoryId: string) => void
}

export const ContinuousMenu = forwardRef<ContinuousMenuRef, ContinuousMenuProps>(
  ({ categories, searchQuery = '', onProductPress, onAddToCart, onCategoryVisible, primaryColor }, ref) => {
    const { width } = useWindowDimensions()
    const scrollViewRef = useRef<ScrollView>(null)
    const categoryPositions = useRef<Record<string, number>>({})
    const isScrollingProgrammatically = useRef(false)

    const availableWidth = width - SIDEBAR_WIDTH - GRID_PADDING * 2
    const cardWidth = (availableWidth - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

    // Filter categories and products based on search query
    const filteredCategories = useMemo(() => {
      if (!searchQuery.trim()) {
        return categories
      }

      const query = searchQuery.toLowerCase()
      return categories
        .map((category) => ({
          ...category,
          products: category.products.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.description?.toLowerCase().includes(query)
          ),
        }))
        .filter((category) => category.products.length > 0)
    }, [categories, searchQuery])

    useImperativeHandle(ref, () => ({
      scrollToCategory: (categoryId: string) => {
        const position = categoryPositions.current[categoryId]
        if (position !== undefined && scrollViewRef.current) {
          isScrollingProgrammatically.current = true
          scrollViewRef.current.scrollTo({ y: position, animated: true })
          // Reset flag after animation
          setTimeout(() => {
            isScrollingProgrammatically.current = false
          }, 500)
        }
      },
    }))

    const handleCategoryLayout = useCallback(
      (categoryId: string) => (event: LayoutChangeEvent) => {
        categoryPositions.current[categoryId] = event.nativeEvent.layout.y
      },
      []
    )

    const handleScroll = useCallback(
      (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (isScrollingProgrammatically.current) return

        const scrollY = event.nativeEvent.contentOffset.y
        const offset = 100 // Offset to determine which category is "active"

        // Find the category that is currently visible
        let visibleCategoryId: string | null = null
        const sortedCategories = Object.entries(categoryPositions.current).sort(
          ([, a], [, b]) => a - b
        )

        for (const [categoryId, position] of sortedCategories) {
          if (position <= scrollY + offset) {
            visibleCategoryId = categoryId
          } else {
            break
          }
        }

        if (visibleCategoryId) {
          onCategoryVisible(visibleCategoryId)
        }
      },
      [onCategoryVisible]
    )

    const renderProductsGrid = (products: PublicProduct[]) => {
      const rows: PublicProduct[][] = []
      for (let i = 0; i < products.length; i += NUM_COLUMNS) {
        rows.push(products.slice(i, i + NUM_COLUMNS))
      }

      return rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap: GAP }]}>
          {row.map((product) => (
            <View key={product.id} style={{ width: cardWidth }}>
              <ProductCard
                product={product}
                onPress={() => onProductPress(product.id)}
                onAddToCart={() => onAddToCart(product)}
                primaryColor={primaryColor}
              />
            </View>
          ))}
          {/* Fill empty space if last row has fewer items */}
          {row.length < NUM_COLUMNS &&
            Array(NUM_COLUMNS - row.length)
              .fill(null)
              .map((_, i) => (
                <View key={`empty-${i}`} style={{ width: cardWidth }} />
              ))}
        </View>
      ))
    }

    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {filteredCategories.map((category) => (
            <View
              key={category.id}
              onLayout={handleCategoryLayout(category.id)}
              style={styles.categorySection}
            >
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {renderProductsGrid(category.products)}
            </View>
          ))}
          {filteredCategories.length === 0 && searchQuery.trim() && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>
                Nenhum produto encontrado para "{searchQuery}"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.lg,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  emptySearch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptySearchText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
