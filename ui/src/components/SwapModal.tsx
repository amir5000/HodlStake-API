import { useGetMarkets } from "@/services/reactQuery/useGetMarkets"
import { Input } from "./ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { useAtomValue } from "jotai"
import { stateAtom } from "@/services/jotai"
import { useState, type ChangeEvent } from "react"
import dayjs from "dayjs"
import Loader from "./Loader"
import { useAccount, useReadContracts } from "wagmi"
import { erc20Abi, formatUnits, parseUnits } from "viem"
import chains from "@/helpers/chains"
import { Button } from "./ui/button"
import { useGetSwapQuote } from "@/services/reactQuery/useGetSwapQuote"
import useDebounce from "@/helpers/useDebounce"
import WalletConnectButton from "./WalletConnectButton"
import { useGetMarketData } from "@/services/reactQuery/useGetMarketData"
import useGetTangoCards from "@/services/reactQuery/useGetTangoCards"
import useGetTangoAuthToken from "@/services/reactQuery/useGetTangoAuthToken"
import ConfirmationStep from "./ConfirmationStep"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"

export default function SwapModal() {
    const [selectedAsset, setSelectedAsset] = useState("")
    const [lockAsset, setLockAsset] = useState("")
    const debouncedAmountQuery = useDebounce(lockAsset, 500)
    const [selectedGiftCard, setSelectedGiftCard] = useState("")
    const [maxError, setMaxError] = useState(false)
    const [step, setStep] = useState(0)
    const { address, isConnected } = useAccount()
    const state = useAtomValue(stateAtom)
    const chainId = state.chainId

    const { data: token } = useGetTangoAuthToken({
        enabled: true,
    })

    const { data: catalogs } = useGetTangoCards({
        enabled: Boolean(token?.access_token),
        accessToken: token?.access_token || "",
    })

    const { data: markets, isLoading: marketsIsLoading } = useGetMarkets(chainId)

    const findAsset = markets?.markets.find((market) => market.pt === selectedAsset)
    const findAssetIndex = markets?.markets.findIndex((market) => market.pt === selectedAsset) || 0

    const { data: marketData } = useGetMarketData({
        chainId,
        marketAddress: findAsset?.address || "",
    })

    const contracts =
        (address &&
            markets?.markets.map((market) => ({
                address: market.name.includes("USDC") ? chains[chainId].USDCAddress : market.underlyingAsset.split("-")[1],
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address],
            }))) ||
        ([] as any)

    const contractsDecimals =
        markets?.markets.map((market) => ({
            address: market.name.includes("USDC") ? chains[chainId].USDCAddress : market.underlyingAsset.split("-")[1],
            abi: erc20Abi,
            functionName: "decimals",
        })) || ([] as any)

    const { data: balanceResults } = useReadContracts({
        contracts,
        query: {
            enabled: !!address && !!markets,
        },
    })

    const { data: decimalsResults } = useReadContracts({
        contracts: contractsDecimals,
        query: {
            enabled: !!markets,
        },
    })

    // console.log("decimalsResults", decimalsResults, debouncedAmountQuery)
    // console.log("eeee", decimalsResults && decimalsResults?.[findAssetIndex])

    const { data: swapData } = useGetSwapQuote({
        chainId,
        marketAddress: findAsset?.address || "",
        receiver: address || "0x0000000000000000000000000000000000000000",
        amountIn:
            // @ts-ignore
            decimalsResults && decimalsResults?.[findAssetIndex] ? parseUnits(debouncedAmountQuery, decimalsResults?.[findAssetIndex]?.result).toString() : "",
        tokenIn: findAsset?.name.includes("USDC") ? chains[chainId].USDCAddress : findAsset?.underlyingAsset.split("-")[1],
        tokenOut: findAsset?.pt.split("-")[1] || "",
    })

    const handleSelectedAssetChange = (value: string) => {
        setSelectedAsset(value)
        setLockAsset("")
    }

    const handleMaxClick = () => {
        // @ts-ignore
        setLockAsset(formatUnits(balanceResults?.[findAssetIndex].result, decimalsResults?.[findAssetIndex].result))
    }

    const assetBalance =
        address && balanceResults && decimalsResults && balanceResults?.[findAssetIndex] && decimalsResults?.[findAssetIndex]
            ? // @ts-ignore
              Number(formatUnits(balanceResults?.[findAssetIndex]?.result, decimalsResults?.[findAssetIndex]?.result))
            : 0

    const handleLockAssetChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (Number(event.target.value) > assetBalance) {
            setMaxError(true)
        } else {
            setMaxError(false)
        }
        setLockAsset(event.target.value)
    }

    const handleGiftCardChange = (value: string) => {
        setSelectedGiftCard(value)
    }

    const lockUSDValue =
        marketData && debouncedAmountQuery
            ? // @ts-ignore
              Number(marketData?.assetPriceUsd * Number(debouncedAmountQuery)).toFixed(2)
            : 0

    // console.log("lockUSDValue", lockUSDValue)

    const receiveAmount =
        swapData && debouncedAmountQuery && decimalsResults && decimalsResults?.[findAssetIndex]
            ? // @ts-ignore
              BigInt(swapData?.data.amountOut) - parseUnits(debouncedAmountQuery, decimalsResults?.[findAssetIndex]?.result)
            : 0n
    // console.log("receiveAmount", receiveAmount)
    const usdReceiveAmount =
        marketData && receiveAmount && decimalsResults && decimalsResults?.[findAssetIndex]
            ? // @ts-ignore
              Number(marketData?.assetPriceUsd * Number(formatUnits(receiveAmount, decimalsResults?.[findAssetIndex]?.result))).toFixed(2)
            : 0

    const giftCards = catalogs?.brands.filter((brand) => {
        return (
            brand.status === "active" &&
            brand.categories.length > 0 &&
            brand.items.some((item) => item.status === "active" && item.countries.includes("US") && item.valueType === "VARIABLE_VALUE")
        )
    })

    const selectedGiftCardBrand = giftCards?.find((brand) => brand.brandName === selectedGiftCard)

    const isAmountTooLowForCard = lockAsset && selectedGiftCardBrand?.items[0] ? Number(usdReceiveAmount) < selectedGiftCardBrand?.items[0]?.minValue : false

    const isAmountTooHighForCard = lockAsset && selectedGiftCardBrand?.items[0] ? Number(usdReceiveAmount) > selectedGiftCardBrand?.items[0]?.maxValue : false
    console.log("selectedGiftCardBrand?.items[0]?.maxValue: ", selectedGiftCardBrand?.items[0]?.maxValue)

    if (marketsIsLoading) {
        return (
            <div className="w-full bg-charcoal rounded-2xl p-4">
                <div className="flex flex-col">
                    <div className="flex flex-row gap-12 items-center justify-center rounded-xl p-4">
                        <Loader />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full bg-charcoal rounded-2xl p-4 mb-12">
            {step === 1 ? (
                <ConfirmationStep
                    lockAsset={lockAsset}
                    findAsset={findAsset}
                    selectedGiftCard={selectedGiftCard}
                    usdReceiveAmount={usdReceiveAmount}
                    handleSetStep={(step) => setStep(step)}
                />
            ) : (
                <div className="flex flex-col">
                    <div className="flex flex-row gap-12 items-center bg-[#1F1F1F] rounded-xl py-4 px-8">
                        <div className="flex flex-col items-start gap-2 w-1/2 relative">
                            <p className="text-xl">Lock Asset</p>
                            {assetBalance ? (
                                <Button onClick={handleMaxClick} variant="link" className="text-hodl-pink absolute top-12 right-1 text-xl">
                                    Max
                                </Button>
                            ) : null}
                            <Input
                                onChange={handleLockAssetChange}
                                disabled={Boolean(!findAsset)}
                                value={lockAsset}
                                placeholder="0.00"
                                type="number"
                                className="w-full h-18 !text-3xl border-none font-bold rounded-lg p-2"
                            />
                            {maxError ? <p className="text-red-500 text-sm">Insufficient funds available</p> : null}
                            <p className="text-xl">${lockUSDValue}</p>
                        </div>
                        <div className="flex flex-col gap-2 w-1/2">
                            <Select onValueChange={handleSelectedAssetChange} value={selectedAsset}>
                                <SelectTrigger className="w-full h-18 text-xl border-none rounded-lg p-2 !bg-black">
                                    <SelectValue placeholder="Select Asset" />
                                </SelectTrigger>
                                <SelectContent className="bg-charcoal">
                                    {markets?.markets.map((market) => (
                                        <SelectItem key={market.address} value={market.pt}>
                                            {market.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {findAsset ? <p className="text-sm">Unlock {dayjs(findAsset?.expiry).format("MM/DD/YYYY")}</p> : null}
                            {findAsset && balanceResults?.[findAssetIndex] ? (
                                <p className="text-sm">
                                    {findAsset.name} balance {/* @ts-ignore */}
                                    {Number(formatUnits(balanceResults?.[findAssetIndex].result, decimalsResults?.[findAssetIndex].result)).toFixed(2)}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-col w-full h-2 z-30 items-center justify-center">
                        <img src="/src/assets/arrow-Icon.svg" alt="arrow" className="w-10 h-10 rounded-full bg-hodl-pink p-2" />
                    </div>
                    <div className="bg-[#1F1F1F] rounded-xl pt-12">
                        <div className="flex flex-row gap-12 px-8 mb-6">
                            <div className="flex flex-col items-start gap-2 w-1/2">
                                <p className="text-xl">Receive</p>
                                <p className="text-3xl font-bold">${usdReceiveAmount}</p>
                            </div>
                            <div className="flex flex-col gap-2 w-1/2">
                                <p className="text-sm">&nbsp;</p>
                                <Select onValueChange={handleGiftCardChange} value={selectedGiftCard}>
                                    <SelectTrigger className="w-full h-18 text-xl border-none rounded-lg p-2 !bg-black">
                                        <SelectValue placeholder="Select Gift Card" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-charcoal">
                                        {giftCards?.map((brand) => (
                                            <SelectItem key={brand.brandKey} value={brand.brandName}>
                                                {brand.brandName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm">Delivered Instantly</p>
                            </div>
                        </div>
                        {isAmountTooLowForCard ? (
                            <p className="text-red-500 text-sm mt-4">
                                Amount too low for this gift card. Minimum amount is ${selectedGiftCardBrand?.items[0]?.minValue}
                            </p>
                        ) : null}
                        {isAmountTooHighForCard ? (
                            <p className="text-red-500 text-sm mt-4">
                                Amount too high for this gift card. Maximum amount is ${selectedGiftCardBrand?.items[0]?.maxValue}
                            </p>
                        ) : null}
                        {isConnected ? (
                            <Button
                                className="w-full mt-4"
                                onClick={() => {
                                    setStep(1)
                                }}
                                disabled={!lockAsset || !selectedAsset || !selectedGiftCard || maxError || isAmountTooLowForCard || isAmountTooHighForCard}
                            >
                                Next
                            </Button>
                        ) : (
                            <WalletConnectButton fullWidth />
                        )}
                    </div>
                </div>
            )}

            {step === 0 ? (
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Transaction Breakdown</AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row justify-between">
                                    <p className="text-sm">Lock Asset</p>
                                    <p className="text-sm">
                                        {lockAsset || 0} {findAsset?.name}
                                    </p>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <p className="text-sm">Time to Unlock</p>
                                    <p className="text-sm">{dayjs(findAsset?.expiry).startOf("day").diff(dayjs().startOf("day"), "day")} days</p>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <p className="text-sm">Fee (10%)</p>
                                    <p className="text-sm">${(Number(usdReceiveAmount) / 10).toFixed(2)}</p>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <p className="text-sm">Gift Card Total</p>
                                    <p className="text-sm">${usdReceiveAmount}</p>
                                </div>
                                <div className="flex flex-row justify-between">
                                    <p className="text-sm">Merchant</p>
                                    <p className="text-sm">{selectedGiftCard}</p>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            ) : null}
        </div>
    )
}
