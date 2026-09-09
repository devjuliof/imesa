import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { checkAndApplyUpdate } from '../services/updateService'

/**
 * Keeps the tablet on the latest published OTA bundle without a manual
 * reinstall: checks for an update when the app starts and every time it comes
 * back to the foreground, applying it (with a reload) as soon as one is found.
 *
 * A foreground return implies the tablet was idle, so reloading then does not
 * interrupt an in-progress order.
 */
export const useAutoUpdate = () => {
  const isChecking = useRef(false)

  useEffect(() => {
    const run = async () => {
      if (isChecking.current) return
      isChecking.current = true
      try {
        await checkAndApplyUpdate()
      } finally {
        isChecking.current = false
      }
    }

    run()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run()
    })

    return () => subscription.remove()
  }, [])
}
