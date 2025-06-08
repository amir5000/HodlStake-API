import { Wallet, JsonRpcProvider, Interface, formatEther, formatUnits, Contract } from "ethers";

const provider = new JsonRpcProvider("https://base.llamarpc.com");

export function getSigner() {
    const signer = new Wallet(process.env.PRIVATE_KEY!, provider);
    return signer;
}

export function getTokenABI() {
    return [
        "function approve(address spender,uint256 amount) external returns (bool)",
        "function allowance(address owner,address spender) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to,uint256 amount) returns (bool)",
    ];
}

/**
 * Returns every value‑moving action in the tx:
 *  - native‑coin transfers
 *  - ERC‑20 Transfer
 *  - ERC‑721 Transfer
 *  - ERC‑1155 TransferSingle / TransferBatch
 */
export async function getTransfers(txHash: string) {
    const tx = await provider.getTransaction(txHash); // from, to, value
    const receipt = await provider.getTransactionReceipt(txHash); // logs

    const transfers: Array<{
        token: string; // "ETH" for native, or token contract addr
        from: string;
        to: string;
        amount: bigint | string; // bigint for ETH/ERC‑20, string for NFTs
        id?: bigint; // tokenId for NFTs
    }> = [];

    // 1️⃣ Native coin (ETH, MATIC, etc.)
    if (tx && tx.value && tx.value > 0n) {
        transfers.push({
            token: "ETH",
            from: tx.from!,
            to: tx.to!,
            amount: tx.value, // wei
        });
    }

    // 2️⃣ ERC‑20 / 721 / 1155 logs
    const iface = new Interface([
        "event Transfer(address indexed from,address indexed to,uint256 value)",
        "event Transfer(address indexed from,address indexed to,uint256 indexed id)",
        "event TransferSingle(address indexed operator,address indexed from,address indexed to,uint256 id,uint256 value)",
        "event TransferBatch(address indexed operator,address indexed from,address indexed to,uint256[] ids,uint256[] values)",
    ]);

    for (const log of receipt?.logs || []) {
        try {
            const parsed = iface.parseLog(log);

            if (!parsed) {
                continue;
            }

            const token = new Contract(log.address, getTokenABI(), provider);
            const decimals = await token.decimals();

            switch (parsed.name) {
                case "Transfer": {
                    // ERC‑20  **or**  ERC‑721
                    const [from, to, third] = parsed.args as unknown as readonly [string, string, bigint];
                    // Heuristic: value == 1 && ERC‑721 often emits id instead of value
                    transfers.push({
                        token: log.address,
                        from,
                        to,
                        amount: formatUnits(third, decimals),
                        id: parsed.fragment.inputs[2].name === "id" ? third : undefined,
                    });
                    break;
                }

                case "TransferSingle": {
                    const [, from, to, id, value] = parsed.args as unknown as readonly [string, string, string, bigint, bigint];
                    transfers.push({ token: log.address, from, to, amount: formatUnits(value, decimals), id });
                    break;
                }

                case "TransferBatch": {
                    const [, from, to, ids, values] = parsed.args as unknown as readonly [string, string, string, bigint[], bigint[]];
                    ids.forEach((id, i) => transfers.push({ token: log.address, from, to, amount: formatUnits(values[i], decimals), id }));
                    break;
                }
            }
        } catch (_) {
            /* Not a Transfer log; ignore */
        }
    }

    return transfers;
}
