import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { TangoCards } from "@/types"

export default function useGetTangoCards({ enabled, accessToken }: { enabled: boolean; accessToken: string }) {
    // const queryClient = useQueryClient()
    return useQuery({
        queryKey: ["useGetTangoCards"],
        queryFn: async (): Promise<TangoCards> => {
            const { data } = await apiInstance.get("/catalogs", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            return data
        },
        enabled,
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}
