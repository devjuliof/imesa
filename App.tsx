import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { MenuScreen, SetupScreen, ProductDetailScreen, CurrentOrderScreen, OrderConfirmationScreen, CheckoutScreen, PixPaymentScreen, CardPaymentScreen, WaiterScreen } from './src/screens'

import { SessionClosedScreen } from './src/screens/SessionClosedScreen'
import type { CardPaymentType } from './src/types'
import { useConfigStore } from './src/stores/configStore'
import { useSessionSocket } from './src/hooks/useSessionSocket'
import { colors } from './src/theme'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Navigation types
export type RootStackParamList = {
  Setup: undefined
  Menu: undefined
  ProductDetail: { productId: string; editingCartItemKey?: string }
  CurrentOrder: undefined
  OrderConfirmation: undefined
  Checkout: undefined
  PixPayment: { orderId: string; amount: number }
  CardPayment: { orderId: string; amount: number; paymentType: CardPaymentType }
  WaiterMode: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppContent() {
  const [isHydrated, setIsHydrated] = useState(false)
  const isConfigured = useConfigStore((state) => state.isConfigured)
  const navigationRef = useNavigationContainerRef<RootStackParamList>()

  // Connect to WebSocket for session lifecycle events
  const { sessionClosed, clearSessionClosed } = useSessionSocket()

  const handleSessionClosedDismiss = useCallback(() => {
    clearSessionClosed()
    // Navigate back to the menu screen for the next customer
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Menu' }],
      })
    }
  }, [clearSessionClosed, navigationRef])

  useEffect(() => {
    // Wait for zustand persist to rehydrate
    const unsubscribe = useConfigStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })

    // Check if already hydrated
    if (useConfigStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }

    return unsubscribe
  }, [])

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isConfigured ? 'Menu' : 'Setup'}
      >
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ presentation: 'transparentModal', animation: 'none' }}
        />
        <Stack.Screen
          name="CurrentOrder"
          component={CurrentOrderScreen}
          options={{ presentation: 'transparentModal', animation: 'none' }}
        />
        <Stack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="PixPayment" component={PixPaymentScreen} />
        <Stack.Screen name="CardPayment" component={CardPaymentScreen} />
        <Stack.Screen name="WaiterMode" component={WaiterScreen} />
      </Stack.Navigator>

      {/* Session closed overlay - shown on top of everything */}
      {sessionClosed && (
        <SessionClosedScreen onDismiss={handleSessionClosedDismiss} />
      )}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
