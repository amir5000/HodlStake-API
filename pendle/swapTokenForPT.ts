type SwapTokenForPTParams = {
    receiver: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    chainId: string;
    marketAddress: string;
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

type SwapTokenForPTResponse = {
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
export async function swapTokenForPT({ receiver, tokenIn, tokenOut, amountIn, chainId, marketAddress }: SwapTokenForPTParams): Promise<SwapTokenForPTResponse> {
    const body = {
        receiver,
        tokenIn,
        tokenOut,
        amountIn,
        slippage: "0.01",
    };

    const url = `${process.env.HOSTED_SDK_URL}v1/sdk/${chainId}/markets/${marketAddress}/swap?${new URLSearchParams(body).toString()}`;

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
