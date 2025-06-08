import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { Market } from "@/types"

export function useGetMarkets(chainId: number) {
    return useQuery({
        queryKey: ["markets", chainId],
        queryFn: async (): Promise<{
            markets: Market[]
        }> => {
            const response = await apiInstance.get(`/markets/${chainId}`)
            return response.data
        },
        enabled: !!chainId,
    })
}
