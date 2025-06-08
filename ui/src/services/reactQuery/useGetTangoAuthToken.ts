import { useQuery } from "@tanstack/react-query"
import apiInstance from "../apiInstance"
import type { AuthToken } from "@/types"

export default function useGetTangoAuthToken({ enabled }: { enabled: boolean }) {
    // const queryClient = useQueryClient()
    return useQuery({
        queryKey: ["authToken"],
        queryFn: async (): Promise<AuthToken> => {
            const { data } = await apiInstance.get("/tangocard/auth")
            return data
        },
        enabled,
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}
