const mockUpdates = {
  isEnabled: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}

jest.mock('expo-updates', () => mockUpdates)

// The service reads `Updates.isEnabled` once at module load (babel snapshots the
// namespace value), so load it fresh per test after setting the desired state.
const loadCheckAndApplyUpdate = (): (() => Promise<boolean>) => {
  let fn: () => Promise<boolean> = async () => false
  jest.isolateModules(() => {
    fn = require('./updateService').checkAndApplyUpdate
  })
  return fn
}

describe('checkAndApplyUpdate', () => {
  beforeEach(() => {
    mockUpdates.isEnabled = true
    mockUpdates.checkForUpdateAsync.mockReset()
    mockUpdates.fetchUpdateAsync.mockReset().mockResolvedValue({ isNew: true })
    mockUpdates.reloadAsync.mockReset().mockResolvedValue(undefined)
  })

  it('fetches and reloads when an update is available', async () => {
    mockUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true })

    const applied = await loadCheckAndApplyUpdate()()

    expect(mockUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1)
    expect(mockUpdates.reloadAsync).toHaveBeenCalledTimes(1)
    expect(applied).toBe(true)
  })

  it('does nothing when no update is available', async () => {
    mockUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false })

    const applied = await loadCheckAndApplyUpdate()()

    expect(mockUpdates.fetchUpdateAsync).not.toHaveBeenCalled()
    expect(mockUpdates.reloadAsync).not.toHaveBeenCalled()
    expect(applied).toBe(false)
  })

  it('skips entirely when updates are disabled (dev / Expo Go)', async () => {
    mockUpdates.isEnabled = false

    const applied = await loadCheckAndApplyUpdate()()

    expect(mockUpdates.checkForUpdateAsync).not.toHaveBeenCalled()
    expect(applied).toBe(false)
  })

  it('never throws when the update check fails (keeps the kiosk running)', async () => {
    mockUpdates.checkForUpdateAsync.mockRejectedValue(new Error('network down'))

    const applied = await loadCheckAndApplyUpdate()()

    expect(mockUpdates.reloadAsync).not.toHaveBeenCalled()
    expect(applied).toBe(false)
  })
})
