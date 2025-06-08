import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetPositions } from "@/services/reactQuery/useGetPositions"
import { useState } from "react"
import { useAccount } from "wagmi"
import { useAtomValue } from "jotai"
import { stateAtom } from "@/services/jotai"
import { useGetMarkets } from "@/services/reactQuery/useGetMarkets"
import type { Position } from "@/types"
import dayjs from "dayjs"
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyAccount() {
    const [activeTab, setActiveTab] = useState("active")
    const { address } = useAccount()
    const { chainId } = useAtomValue(stateAtom)

    const { data: markets, isLoading: marketsIsLoading } = useGetMarkets(chainId)

    const { data: positionsData, isLoading: positionsIsLoading } = useGetPositions(address || "")

    const positions = positionsData?.positions.filter((position) => position.chainId === chainId)

    const currentOpenPositions = positions?.reduce((acc, position) => {
        if (position.openPositions.length > 0) {
            acc.push(...position.openPositions)
        }
        return acc
    }, [] as Position[])

    const currentClosedPositions = positions?.reduce((acc, position) => {
        if (position.closedPositions.length > 0) {
            acc.push(...position.closedPositions)
        }
        return acc
    }, [] as Position[])

    const isLoading = marketsIsLoading || positionsIsLoading

    return (
        <div className="flex-1 w-full px-8 lg:px-32 mt-16">
            <h1 className="text-4xl font-bold">My Account</h1>

            <div className="border border-slate-800 rounded-lg p-4 bg-black mt-8 z-50">
                <h2 className="text-2xl font-bold">My Assets</h2>
                <div className="flex flex-row justify-between items-center">
                    <p className="text-sm text-slate-400">View your transaction history and track when your asset unlocks.</p>
                    {address && (
                        <div className="flex flex-row gap-2">
                            <Button variant={`${activeTab === "active" ? "default" : "outline"}`} onClick={() => setActiveTab("active")}>
                                Active
                            </Button>
                            <Button variant={`${activeTab === "completed" ? "default" : "outline"}`} onClick={() => setActiveTab("completed")}>
                                Completed
                            </Button>
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-2 mt-8">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                )}

                {!address && !isLoading && <p className="text-sm text-slate-300 text-center mt-8">Connect your wallet to view your transactions.</p>}
                {address && !isLoading && (
                    <div className="border border-slate-800 rounded-lg mt-8">
                        <Table className="">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Unlock Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeTab === "active" && currentOpenPositions && currentOpenPositions.length > 0 ? (
                                    currentOpenPositions?.map((position, index) => {
                                        const market = markets?.markets.find((market) => position.marketId.includes(market.address))

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{market?.name}</TableCell>
                                                <TableCell>{position.pt.valuation}</TableCell>
                                                <TableCell>
                                                    {dayjs(market?.expiry).format("MM/DD/YYYY")} (in {dayjs(market?.expiry).diff(dayjs(), "days")} days)
                                                </TableCell>
                                                <TableCell>
                                                    {position.pt.valuation > 0 && dayjs(market?.expiry).isAfter(dayjs()) ? (
                                                        <Button variant="outline">
                                                            <LockClosedIcon />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="default">
                                                            <LockOpen1Icon />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : activeTab === "active" ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No open positions
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                                {activeTab === "completed" && currentClosedPositions && currentClosedPositions.length > 0 ? (
                                    currentClosedPositions?.map((position, index) => {
                                        const market = markets?.markets.find((market) => position.marketId.includes(market.address))
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{market?.name}</TableCell>
                                                <TableCell>{position.pt.valuation}</TableCell>
                                                <TableCell>-- (already closed)</TableCell>
                                                <TableCell>Closed</TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : activeTab === "completed" ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No closed positions
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}
