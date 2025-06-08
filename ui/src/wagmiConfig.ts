import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { getDefaultConfig } from "connectkit"

export const config = createConfig(
    getDefaultConfig({
        // Your dApps chains
        chains: [base],
        transports: {
            // RPC URL for each chain
            [base.id]: http(`https://mainnet.base.org`),
        },
        // Required API Keys
        walletConnectProjectId: "58708bd02fb51f82275df92c13b44c36",
        // Required App Info
        appName: "Hodl",
        // Optional App Info
        appDescription: "Hodl is a platform for hodling tokens",
        appUrl: "https://hodl.shop", // your app's url
    })
)
