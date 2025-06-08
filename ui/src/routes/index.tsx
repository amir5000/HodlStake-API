import { useAccount } from "wagmi"
import SwapModal from "@/components/SwapModal"
import { useAtom } from "jotai"
import { stateAtom } from "@/services/jotai"
import { useEffect } from "react"

export default function Home() {
    const { address, isConnecting, isDisconnected } = useAccount()
    console.log(address)

    const [state, setState] = useAtom(stateAtom)

    useEffect(() => {
        setState({
            ...state,
            address: address ?? "",
        })
    }, [address])

    return (
        <div className="flex-1 flex flex-col items-center self-center mt-[10%] max-w-[520px] w-full text-center mx-8 xl:mx-24 z-10">
            <h1 className="text-4xl font-bold">Buy Now, Pay Never</h1>
            <p className="text-lg mt-4">Lock your assets and redeem future yield for a gift card you can spend today!</p>
            <SwapModal />
        </div>
    )
}
