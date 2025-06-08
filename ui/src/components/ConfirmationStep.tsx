import type { Market } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import dayjs from "dayjs"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"

export default function ConfirmationStep({
    lockAsset,
    findAsset,
    selectedGiftCard,
    usdReceiveAmount,
    handleSetStep,
}: {
    lockAsset: string
    findAsset: Market | undefined
    selectedGiftCard: string
    usdReceiveAmount: number | string
    handleSetStep: (step: number) => void
}) {
    const [email, setEmail] = useState("")
    const [isValidEmail, setIsValidEmail] = useState(false)

    useEffect(() => {
        setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    }, [email])

    return (
        <div className="flex flex-col w-full h-full px-4">
            <div className="flex flex-col w-full h-8 z-30 items-center justify-center" onClick={() => handleSetStep(0)}>
                <img src="/src/assets/arrow-Icon.svg" alt="arrow" className="w-10 h-10 rounded-full bg-hodl-pink p-2 self-end rotate-90" />
            </div>
            <h2 className="text-xl text-left font-bold mb-4">Transaction Summary</h2>
            <div className="flex flex-row justify-between">
                <p className="text-base">Lock Asset</p>
                <p className="text-base">
                    {lockAsset || 0} {findAsset?.name}
                </p>
            </div>
            <div className="flex flex-row justify-between">
                <p className="text-base">Time to Unlock</p>
                <p className="text-base">{dayjs(findAsset?.expiry).startOf("day").diff(dayjs().startOf("day"), "day")} days</p>
            </div>
            <div className="flex flex-row justify-between">
                <p className="text-base">Fee (10%)</p>
                <p className="text-base">${(Number(usdReceiveAmount) / 10).toFixed(2)}</p>
            </div>
            {/* <div className="flex flex-row justify-between">
                <p className="text-base">Network Cost</p>
                <p className="text-base"></p>
            </div> */}
            <div className="flex flex-row justify-between">
                <p className="text-base">Gift Card Total</p>
                <p className="text-base">${usdReceiveAmount}</p>
            </div>
            <div className="flex flex-row justify-between">
                <p className="text-base">Merchant</p>
                <p className="text-base">{selectedGiftCard}</p>
            </div>

            <div className="grid w-full gap-4 my-8">
                <Label htmlFor="email" className="text-xl">
                    Email Address
                </Label>
                <Input
                    className="!text-xl h-12 w-full"
                    placeholder="Email Address"
                    id="email"
                    type="email"
                    onChange={(event) => setEmail(event.target.value)}
                    value={email}
                />
                <p className="text-sm text-gray-300 text-center">
                    Gift cards are only delivered by email. <br /> Gift cards can not be reclaimed after confirmation.
                </p>
            </div>

            <Button disabled={!isValidEmail}>Confirm Transaction</Button>

            <p className="text-sm text-gray-300 text-center mt-4">
                By clicking confirm, you agree to our <a href="#">terms of service</a>
            </p>
        </div>
    )
}
