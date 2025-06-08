import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { Market, SwapTokenForPTResponse } from "@/types"

export function useGetSwapQuote({
    chainId,
    marketAddress,
    receiver,
    amountIn,
    tokenIn,
    tokenOut,
}: {
    chainId: number
    marketAddress: string
    receiver: string
    amountIn: string
    tokenIn: string
    tokenOut: string
}) {
    return useQuery({
        queryKey: ["swapQuote", chainId, marketAddress, receiver, amountIn],
        queryFn: async (): Promise<SwapTokenForPTResponse> => {
            console.log("amountIn", amountIn)
            const response = await apiInstance.post(`/markets/${chainId}/${marketAddress}/swap`, {
                receiver,
                amountIn,
                tokenIn,
                tokenOut,
            })
            return response.data
        },
        enabled: !!chainId && !!receiver && !!amountIn && amountIn !== "0" && !!tokenIn && !!tokenOut && !!marketAddress,
    })
}
