import { Link } from "react-router"
import { stateAtom } from "@/services/jotai"
import { useGetMarkets } from "@/services/reactQuery/useGetMarkets"
import { useAtomValue } from "jotai"
import Loader from "./Loader"
import WalletConnectButton from "./WalletConnectButton"
import hodlLogo from "@/assets/hodl-logo.png"

export default function Header() {
    const state = useAtomValue(stateAtom)
    const { data: markets, isLoading: marketsIsLoading } = useGetMarkets(state.chainId)

    return (
        <header>
            <div className="flex flex-row justify-center items-center gap-6 bg-black py-2 px-4">
                {marketsIsLoading ? (
                    <Loader width={40} />
                ) : (
                    <>
                        <div>
                            <p className="text-sm">Current Lock Rates</p>
                        </div>
                        {markets &&
                            markets.markets &&
                            markets.markets.map((market) => (
                                <div key={market.address}>
                                    <p className="text-sm">
                                        {market.name}: <span className="text-neon">{Number(market.details.impliedApy * 100).toFixed(2)}%</span>
                                    </p>
                                </div>
                            ))}
                    </>
                )}
            </div>
            <div className="container mx-auto flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                    <Link to="/">
                        <img src={hodlLogo} alt="Hodl" className="w-22" />
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-around">
                        <Link className="px-6 text-white" to="/">
                            learn more.
                        </Link>
                        <Link className="px-6 text-white" to="/my-account">
                            my account.
                        </Link>
                    </div>
                    <WalletConnectButton />
                </div>
            </div>
        </header>
    )
}
