import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { MarketDataResponse } from "@/types"

export function useGetMarketData({ chainId, marketAddress }: { chainId: number; marketAddress: string }) {
    return useQuery({
        queryKey: ["marketData", chainId, marketAddress],
        queryFn: async (): Promise<MarketDataResponse> => {
            const response = await apiInstance.get(`/markets/${chainId}/${marketAddress}/data`)
            return response.data
        },
        enabled: !!chainId && !!marketAddress,
    })
}
