import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { Positions } from "@/types"

export function useGetPositions(address: string) {
    return useQuery({
        queryKey: ["positions", address],
        queryFn: async (): Promise<Positions> => {
            const response = await apiInstance.get(`https://api-v2.pendle.finance/core/v1/dashboard/positions/database/${address}`)
            return response.data
        },
        enabled: !!address,
    })
}

// bff/v1/pnl/transactions?user=0xaeeb80e444d71ba9d80e2f6742755906ab50c02b&market=0x3124d41708edbdc7995a55183e802e3d9d0d5ef1&chainId=8453&limit=50&skip=0
