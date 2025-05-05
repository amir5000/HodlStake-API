import { Wallet, JsonRpcProvider } from "ethers";

export function getSigner() {
    const provider = new JsonRpcProvider("https://base.llamarpc.com");
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
