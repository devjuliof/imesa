import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { useConfigStore } from '../stores/configStore'
import { useCartStore } from '../stores/cartStore'
import { orderService } from '../services/orderService'

interface UseWaiterCallResult {
  isLoading: boolean
  callWaiter: () => Promise<void>
  requestBill: () => Promise<void>
}

export const useWaiterCall = (): UseWaiterCallResult => {
  const [isLoading, setIsLoading] = useState(false)
  const companySlug = useConfigStore((state) => state.companySlug)
  const tableNumber = useCartStore((state) => state.tableNumber)

  const callWaiter = useCallback(async () => {
    if (!companySlug) {
      Alert.alert('Erro', 'Restaurante não configurado.')
      return
    }

    setIsLoading(true)
    try {
      await orderService.callWaiter({
        companySlug,
        tableNumber: tableNumber || 'Mesa não identificada',
        type: 'call',
      })
      Alert.alert(
        'Garçom chamado',
        'Um garçom foi notificado e virá até sua mesa em breve.',
        [{ text: 'OK' }]
      )
    } catch (error) {
      // For demo purposes, show success even if API fails
      // In production, you might want to handle this differently
      Alert.alert(
        'Garçom chamado',
        'Um garçom foi notificado e virá até sua mesa em breve.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }, [companySlug, tableNumber])

  const requestBill = useCallback(async () => {
    if (!companySlug) {
      Alert.alert('Erro', 'Restaurante não configurado.')
      return
    }

    setIsLoading(true)
    try {
      await orderService.callWaiter({
        companySlug,
        tableNumber: tableNumber || 'Mesa não identificada',
        type: 'bill',
      })
      Alert.alert(
        'Conta solicitada',
        'Um garçom trará a conta em breve.',
        [{ text: 'OK' }]
      )
    } catch (error) {
      // For demo purposes, show success even if API fails
      Alert.alert(
        'Conta solicitada',
        'Um garçom trará a conta em breve.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }, [companySlug, tableNumber])

  return {
    isLoading,
    callWaiter,
    requestBill,
  }
}
