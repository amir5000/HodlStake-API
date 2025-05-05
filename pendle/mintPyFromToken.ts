type MintPyFromTokenParams = {
    receiver: string;
    yt: string;
    tokenIn: string;
    amountIn: string;
    slippage?: string;
    chainId: string;
    decimals: string;
};

type ContractCallParams = [
    address1: string,
    address2: string,
    amountOut: string,
    additionalParams: {
        tokenIn: string;
        netTokenIn: string;
        tokenMintSy: string;
        pendleSwap: string;
        swapData: {
            swapType: string;
            extRouter: string;
            extCalldata: string;
            needScale: boolean;
        };
    }
];

type TokenApproval = { token: string; amount: string };

type MintPyFromTokenResponse = {
    method: string;
    contractCallParamsName: string[];
    contractCallParams: ContractCallParams[];
    tx: {
        data: string;
        to: string;
        from: string;
    };
    tokenApprovals: TokenApproval[];
    data: { amountOut: string; priceImpact: number };
};

// 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
export async function mintPyFromToken({
    receiver,
    yt,
    tokenIn,
    amountIn,
    slippage = "0.01",
    chainId,
    decimals,
}: MintPyFromTokenParams): Promise<MintPyFromTokenResponse> {
    const amountInBigInt = BigInt(amountIn) * 10n ** BigInt(decimals);

    const body = {
        receiver,
        yt,
        tokenIn,
        amountIn: amountInBigInt.toString(),
        slippage,
        enableAggregator: "true", // enable aggregator, else it will throw an error because token could not be directly swapped to PT/YT
    };

    const url = `${process.env.HOSTED_SDK_URL}v1/sdk/${chainId}/mint?${new URLSearchParams(body).toString()}`;

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
        console.error("Error fetching markets:", error);
        throw new Error("Internal server error");
    }

    // Send tx
    // getSigner().sendTransaction(res.tx);
}
