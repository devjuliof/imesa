import { useQuery } from '@tanstack/react-query'
import { menuService } from '../services/menuService'
import { useCompanyStore } from '../stores/companyStore'
import { useEffect } from 'react'

export const useMenu = (companySlug: string) => {
  const setCompany = useCompanyStore((state) => state.setCompany)

  const query = useQuery({
    queryKey: ['menu', companySlug],
    queryFn: () => menuService.getPublicMenu(companySlug),
    enabled: !!companySlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Update company store when data is fetched
  useEffect(() => {
    if (query.data?.company) {
      setCompany(query.data.company)
    }
  }, [query.data?.company, setCompany])

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
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    product: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
