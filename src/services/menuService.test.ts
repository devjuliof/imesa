import { menuService } from './menuService'
import { api } from './api'

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
  },
}))

const mockedGet = api.get as jest.Mock

describe('menuService.getPublicMenu', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({
      data: { data: { company: null, categories: [] } },
    })
  })

  it('requests only dine_in products (tablet is a salão device)', async () => {
    await menuService.getPublicMenu('forja-bbq')

    expect(mockedGet).toHaveBeenCalledWith('/public/menu/forja-bbq', {
      params: { channel: 'dine_in' },
    })
  })
})
