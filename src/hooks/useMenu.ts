import { useQuery, useQueryClient } from '@tanstack/react-query'
import { menuService } from '../services/menuService'
import { useCompanyStore } from '../stores/companyStore'
import { useEffect } from 'react'

export const useMenu = (companySlug: string) => {
  const setCompany = useCompanyStore((state) => state.setCompany)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['menu', companySlug],
    queryFn: () => menuService.getPublicMenu(companySlug),
    enabled: !!companySlug,
    staleTime: 0,
    refetchInterval: 1000 * 30, // 30 seconds
    refetchIntervalInBackground: true,
  })

  // Update company store when data is fetched
  useEffect(() => {
    if (query.data?.company) {
      setCompany(query.data.company)
    }
  }, [query.data?.company, setCompany])

  // Prefetch all product details in background when menu loads
  useEffect(() => {
    if (!query.data?.categories || !companySlug) return

    const productIds = query.data.categories.flatMap((cat) =>
      cat.products.map((p) => p.id)
    )

    productIds.forEach((productId) => {
      queryClient.prefetchQuery({
        queryKey: ['product', companySlug, productId],
        queryFn: () => menuService.getPublicProduct(companySlug, productId),
        staleTime: 0,
      })
    })
  }, [query.data?.categories, companySlug, queryClient])

  return {
    categories: query.data?.categories ?? [],
    company: query.data?.company ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useProduct = (companySlug: string, productId: string) => {
  const query = useQuery({
    queryKey: ['product', companySlug, productId],
    queryFn: () => menuService.getPublicProduct(companySlug, productId),
    enabled: !!companySlug && !!productId,
    staleTime: 0,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: true,
  })

  return {
    product: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
