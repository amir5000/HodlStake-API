type MarketDataParams = {
    chainId: string;
    marketAddress: string;
};

type MarketDataResponse = {
    timestamp: string;
    liquidity: {
        usd: number;
        acc: number;
    };
    tradingVolume: {
        usd: number;
    };
    underlyingInterestApy: number;
    underlyingRewardApy: number;
    underlyingApy: number;
    impliedApy: number;
    ytFloatingApy: number;
    swapFeeApy: number;
    voterApy: number;
    ptDiscount: number;
    pendleApy: number;
    arbApy: number;
    lpRewardApy: number;
    aggregatedApy: number;
    maxBoostedApy: number;
    estimatedDailyPoolRewards: {
        asset: {
            id: string;
            chainId: number;
            address: string;
            symbol: string;
            decimals: number;
            accentColor: string;
            price: {
                usd: number;
            };
            priceUpdatedAt: string;
            name: string;
        };
        amount: number;
    }[];
    totalPt: number;
    totalSy: number;
    totalLp: number;
    totalActiveSupply: number;
    assetPriceUsd: number;
};

export async function marketData({ chainId, marketAddress }: MarketDataParams): Promise<MarketDataResponse> {
    const url = `${process.env.HOSTED_SDK_URL}v2/${chainId}/markets/${marketAddress}/data`;

    try {
        const response = await fetch(url, {
            method: "GET",
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error fetching mintPyFromToken:", errorText);
            throw new Error(errorText);
        }

        return response.json();
    } catch (error) {
        console.error("Error fetching market data:", error);
        throw new Error("Internal server error");
    }

    // Send tx
    // getSigner().sendTransaction(res.tx);
}
