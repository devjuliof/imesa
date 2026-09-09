import * as Updates from 'expo-updates'

/**
 * Checks for a published OTA update and, if one is available, downloads it and
 * reloads the app so the tablet runs the latest JS bundle without a manual
 * reinstall.
 *
 * Safe to call on every app start / foreground: it is a no-op when updates are
 * disabled (dev build / Expo Go) or when the running bundle is already the
 * latest, and it never throws — a failed check must not crash the kiosk.
 *
 * Returns true only when an update was applied (the app reloads in that case).
 */
export const checkAndApplyUpdate = async (): Promise<boolean> => {
  if (!Updates.isEnabled) return false

  try {
    const { isAvailable } = await Updates.checkForUpdateAsync()
    if (!isAvailable) return false

    await Updates.fetchUpdateAsync()
    await Updates.reloadAsync()
    return true
  } catch {
    return false
  }
}
