import { loadTokenMap, checkAllowance, erc20Approve, } from "@bitteprotocol/agent-sdk";
import { getAddress } from "viem";
// TODO: fix this
// export async function validateExpressRequest(
//   req: Request,
//   safeSaltNonce?: string,
// ): Promise<ExpressResponse | null> {
//   return validateRequest<Request, Response>(
//     req,
//     safeSaltNonce || "0",
//     (data: unknown, init?: { status?: number }) =>
//       Response.json(data, init),
//   );
// }
// CoW (and many other Dex Protocols use this to represent native asset).
export const NATIVE_ASSET = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export async function sellTokenApprovalTx(args) {
    const { from, fromTokenAddress: sellToken, chainId, sellAmount, spender, } = args;
    console.log(`Checking approval for account=${from}, token=${sellToken} on chainId=${chainId}`);
    const allowance = await checkAllowance(getAddress(from), getAddress(sellToken), spender, chainId);
    if (allowance < BigInt(sellAmount)) {
        // Insufficient allowance
        return erc20Approve({
            token: getAddress(sellToken),
            spender,
        });
    }
    return null;
}
export function isNativeAsset(token) {
    return token.toLowerCase() === NATIVE_ASSET.toLowerCase();
}
export var OrderKind;
(function (OrderKind) {
    OrderKind["BUY"] = "buy";
    OrderKind["SELL"] = "sell";
})(OrderKind || (OrderKind = {}));
export function applySlippage(order, bps) {
    const scaleFactor = BigInt(10000);
    if (order.kind === OrderKind.SELL) {
        const slippageBps = BigInt(10000 - bps);
        return {
            buyAmount: ((BigInt(order.buyAmount) * slippageBps) /
                scaleFactor).toString(),
        };
    }
    else if (order.kind === OrderKind.BUY) {
        const slippageBps = BigInt(10000 + bps);
        return {
            sellAmount: ((BigInt(order.sellAmount) * slippageBps) /
                scaleFactor).toString(),
        };
    }
    return order;
}
function getEnvVar(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is not set`);
    }
    return value;
}
export function getZerionKey() {
    return getEnvVar("ZERION_KEY");
}
export function getSafeSaltNonce() {
    const bitteProtocolSaltNonce = "130811896738364156958237239906781888512";
    return process.env.SAFE_SALT_NONCE || bitteProtocolSaltNonce;
}
let tokenMapInstance = null;
export async function getTokenMap() {
    if (tokenMapInstance) {
        return tokenMapInstance;
    }
    console.log("Loading TokenMap...");
    tokenMapInstance = await loadTokenMap(getEnvVar("TOKEN_MAP_URL"));
    return tokenMapInstance;
}
