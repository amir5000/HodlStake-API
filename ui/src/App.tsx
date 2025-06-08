import "./App.css"
import { WagmiProvider } from "wagmi"
import { config } from "./wagmiConfig"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Home from "./routes"
import { Route, Routes } from "react-router"
import { ConnectKitProvider } from "connectkit"
import MyAccount from "./routes/my-account"
import Header from "./components/Header"
import Footer from "./components/Footer"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

function App() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/my-account" element={<MyAccount />} />
                        </Routes>
                        <Footer />
                    </div>
                    <div className="ellipse-bkg-1" />
                    <div className="ellipse-bkg-2" />
                    <div className="ellipse-bkg-3" />
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default App
