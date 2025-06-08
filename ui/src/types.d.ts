export interface Market {
    name: string
    address: string
    expiry: string
    pt: string
    yt: string
    sy: string
    underlyingAsset: string
    details: {
        liquidity: number
        pendleApy: number
        impliedApy: number
        feeRate: number
        movement10Percent: {
            ptMovementUpUsd: number
            ptMovementDownUsd: number
            ytMovementUpUsd: number
            ytMovementDownUsd: number
        }
        yieldRange: {
            min: number
            max: number
        }
        aggregatedApy: number
        maxBoostedApy: number
    }
    isNew: boolean
    timestamp: string
}

export interface EstimatedDailyPoolRewards {
    asset: {
        id: string
        chainId: number
        address: string
        symbol: string
        decimals: number
        accentColor: string
        price: {
            usd: number
        }
        priceUpdatedAt: string
        name: string
    }
    amount: number
}

export interface MarketDataResponse {
    timestamp: string
    liquidity: {
        usd: number
        acc: number
    }
    tradingVolume: {
        usd: number
    }
    underlyingInterestApy: number
    underlyingRewardApy: number
    underlyingApy: number
    impliedApy: number
    ytFloatingApy: number
    swapFeeApy: number
    voterApy: number
    ptDiscount: number
    pendleApy: number
    arbApy: number
    lpRewardApy: number
    aggregatedApy: number
    maxBoostedApy: number
    estimatedDailyPoolRewards: EstimatedDailyPoolRewards[]
    totalPt: number
    totalSy: number
    totalLp: number
    totalActiveSupply: number
    assetPriceUsd: number
}

export type ContractCallParams = [
    address1: string,
    address2: string,
    amountOut: string,
    additionalParams: {
        tokenIn: string
        netTokenIn: string
        tokenMintSy: string
        pendleSwap: string
        swapData: {
            swapType: string
            extRouter: string
            extCalldata: string
            needScale: boolean
        }
    }
]

export type TokenApproval = { token: string; amount: string }

export type SwapTokenForPTResponse = {
    method: string
    contractCallParamsName: string[]
    contractCallParams: ContractCallParams[]
    tx: {
        data: string
        to: string
        from: string
    }
    tokenApprovals: TokenApproval[]
    data: { amountOut: string; priceImpact: number }
}

export interface AuthToken {
    access_token: string
    scope: string
    expires_in: string
    token_type: string
}

export interface TangoCardBrandRequirements {
    alwaysShowDisclaimer: boolean
    disclaimerInstructions: string
    displayInstructions: string
    termsAndConditionsInstructions: string
}

export interface Categories {
    description: string
    identifier: string
}

export interface ImageUrls {
    ["80w-326ppi"]: string
    ["130w-326ppi"]: string
    ["200w-326ppi"]: string
    ["278w-326ppi"]: string
    ["300w-326ppi"]: string
    ["1200w-326ppi"]: string
}

export interface CardItems {
    countries: string[]
    createdDate: string
    credentialTypes: string[]
    currencyCode: string
    fulfillmentType: string
    isExpirable: false
    isWholeAmountValueRequired: false
    lastUpdateDate: string
    maxValue: number
    minValue: number
    redemptionInstructions: string
    rewardName: string
    rewardType: string
    status: "active" | "inactive"
    utid: string
    valueType: string
}

export interface TangoCard {
    brandKey: string
    brandName: string
    createdDate: string
    description: string
    disclaimer: string
    lastUpdateDate: string
    shortDescription: string
    status: "active" | "inactive"
    terms: string
    brandRequirements: TangoCardBrandRequirements
    categories: Categories[]
    imageUrls: ImageUrls
    items: CardItems[]
}

export interface TangoCards {
    brands: TangoCard[]
    catalogName: string
}

export interface Position {
    lp: { valuation: number; balance: string; activeBalance: string }
    activeBalance: string
    balance: string
    valuation: number
    marketId: string
    pt: { valuation: number; balance: string }
    balance: string
    valuation: number
    yt: { valuation: number; balance: string }
    balance: string
    valuation: number
}

export interface PositionResponse {
    chainId: number
    closedPositions: Position[]
    openPositions: Position[]
    syPositions: Position[]
    totalClosed: number
    totalOpen: number
    totalSy: number
    updatedAt: string
}

export interface Positions {
    positions: PositionResponse[]
}
