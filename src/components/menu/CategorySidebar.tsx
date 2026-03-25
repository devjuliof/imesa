import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing } from '../../theme'
import type { PublicCategory } from '../../types'

// Map category icon names from imenu (lucide-react) to MaterialCommunityIcons
type IconName = keyof typeof MaterialCommunityIcons.glyphMap

const CATEGORY_ICON_MAP: Record<string, IconName> = {
  // Food items
  beef: 'food-steak',
  pizza: 'pizza',
  salad: 'food-apple',
  sandwich: 'food',
  soup: 'bowl-mix',
  fish: 'fish',
  egg: 'egg-fried',
  croissant: 'baguette',
  popcorn: 'popcorn',
  cake: 'cake-variant',
  cookie: 'cookie',
  'ice-cream': 'ice-cream',

  // Fruits & vegetables
  apple: 'apple',
  cherry: 'fruit-cherries',
  banana: 'fruit-watermelon',
  carrot: 'carrot',
  leaf: 'leaf',

  // Beverages
  coffee: 'coffee',
  beer: 'beer',
  wine: 'glass-wine',
  'cup-soda': 'cup',
  milk: 'cup-water',

  // Kitchen & cooking
  'utensils-crossed': 'silverware-fork-knife',
  'chef-hat': 'chef-hat',
  flame: 'fire',

  // Decorative
  heart: 'heart',
  star: 'star',
  sparkles: 'shimmer',

  // Legacy mappings (from old implementation)
  burger: 'hamburger',
  dessert: 'ice-cream',
  drink: 'beer',
  meat: 'food-steak',
}

const DEFAULT_ICON: IconName = 'silverware-fork-knife'

const getCategoryIcon = (iconName: string | null): IconName => {
  if (!iconName) return DEFAULT_ICON
  return CATEGORY_ICON_MAP[iconName] || DEFAULT_ICON
}

interface CategorySidebarProps {
  categories: PublicCategory[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
  primaryColor?: string
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  primaryColor = colors.primary,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && [styles.categoryItemSelected, { backgroundColor: primaryColor }],
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={getCategoryIcon(category.icon)}
                size={32}
                color={isSelected ? colors.white : colors.textMuted}
              />
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  scrollContent: {
    paddingTop: 0,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    minHeight: 100,
  },
  categoryItemSelected: {
    borderRadius: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  categoryNameSelected: {
    fontWeight: '600',
    color: colors.white,
  },
})
