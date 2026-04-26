import React, { useState, useCallback, useRef } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  Header,
  CategorySidebar,
  ContinuousMenu,
  CartFooter,
} from '../components/menu'
import type { ContinuousMenuRef } from '../components/menu'
import { useMenu } from '../hooks/useMenu'
import { useCartStore } from '../stores/cartStore'
import { useOrderStore } from '../stores/orderStore'
import { useConfigStore } from '../stores/configStore'
import { colors, spacing, typography } from '../theme'
import type { PublicProduct } from '../types'
import type { RootStackParamList } from '../../App'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const companySlug = useConfigStore((state) => state.companySlug) || ''
  const tableNumber = useConfigStore((state) => state.tableNumber)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarAutoScroll, setSidebarAutoScroll] = useState(false)
  const menuRef = useRef<ContinuousMenuRef>(null)

  const { categories, company, isLoading, isError } = useMenu(companySlug)
  const { getTotal, getItemCount, addItem, setCompanySlug, clearCart } = useCartStore()
  const { clearAllOrders, sentOrders } = useOrderStore()

  // Set company slug when menu loads
  React.useEffect(() => {
    if (company?.slug) {
      setCompanySlug(company.slug)
    }
  }, [company?.slug, setCompanySlug])

  // Select first category by default
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  // Get primary color from company or use default
  const primaryColor = company?.baseColor || colors.primary

  const handleProductPress = useCallback((productId: string) => {
    navigation.navigate('ProductDetail', { productId })
  }, [navigation])

  const handleAddToCart = useCallback(
    (product: PublicProduct) => {
      addItem({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity: 1,
        observations: '',
        additionals: [],
      })
    },
    [addItem]
  )

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSidebarAutoScroll(true)
    setSelectedCategoryId(categoryId)
    menuRef.current?.scrollToCategory(categoryId)
  }, [])

  const handleCategoryVisible = useCallback((categoryId: string) => {
    setSidebarAutoScroll(false)
    setSelectedCategoryId(categoryId)
  }, [])

  // DEV: Reset comanda for testing (long press on header)
  const handleResetComanda = useCallback(() => {
    Alert.alert(
      'Resetar Comanda',
      'Deseja limpar todos os dados da comanda? (Apenas para testes)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: () => {
            clearCart()
            clearAllOrders()
            Alert.alert('Comanda resetada!')
          },
        },
      ]
    )
  }, [clearCart, clearAllOrders])

  const handleCallWaiter = useCallback(() => {
    Alert.alert(
      'Chamar Garçom',
      'Um garçom será notificado e virá até sua mesa em breve.',
      [{ text: 'OK' }]
    )
  }, [])

  const handleCartPress = useCallback(() => {
    navigation.navigate('CurrentOrder')
  }, [navigation])

  const handleViewComanda = useCallback(() => {
    navigation.navigate('Checkout')
  }, [navigation])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Erro ao carregar o cardápio. Tente novamente.
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header wrapper with white background for rounded corners */}
      {/* DEV: Long press to reset comanda */}
      <TouchableOpacity
        style={styles.headerWrapper}
        onLongPress={handleResetComanda}
        activeOpacity={1}
      >
        <Header
          logoUrl={company?.logo}
          companySlug={companySlug}
          companyName={company?.name}
          tableNumber={tableNumber}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCallWaiter={handleCallWaiter}
          primaryColor={primaryColor}
        />
      </TouchableOpacity>

      {/* Separator line between header and menu */}
      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Category Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          autoScrollToSelected={sidebarAutoScroll}
          primaryColor={primaryColor}
        />

        {/* Continuous Menu with all categories */}
        <ContinuousMenu
          ref={menuRef}
          categories={categories}
          searchQuery={searchQuery}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          onCategoryVisible={handleCategoryVisible}
          primaryColor={primaryColor}
        />
      </View>

      {/* Cart Footer */}
      <CartFooter
        itemCount={getItemCount()}
        total={getTotal()}
        onPress={handleCartPress}
        onViewComanda={handleViewComanda}
        hasComanda={sentOrders.length > 0}
        primaryColor={primaryColor}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerWrapper: {
    backgroundColor: colors.white,
  },
  separatorContainer: {
    paddingTop: spacing.md,
    backgroundColor: colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
})
