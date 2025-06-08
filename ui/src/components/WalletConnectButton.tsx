import { ConnectKitButton } from "connectkit"
import { Button } from "./ui/button"

export default function WalletConnectButton({ fullWidth }: { fullWidth?: boolean }) {
    return (
        <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress }) => (
                <Button className={fullWidth ? "w-full text-xl" : ""} variant={isConnected ? "outline" : "default"} onClick={show}>
                    {isConnected ? (
                        <div className="flex items-center gap-2">
                            <i className="rounded-full bg-hodl-pink w-2 h-2"></i>
                            {truncatedAddress}
                        </div>
                    ) : (
                        "connect wallet"
                    )}
                </Button>
            )}
        </ConnectKitButton.Custom>
    )
}
