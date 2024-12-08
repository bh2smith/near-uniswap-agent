import { AlphaRouter, CurrencyAmount, } from "@uniswap/smart-order-router";
import { SwapType } from "@uniswap/smart-order-router";
import { Percent, TradeType } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { getClient } from "near-safe";
export async function getRouter(chainId) {
    const viemClient = getClient(chainId);
    return new AlphaRouter({
        chainId,
        provider: new ethers.providers.JsonRpcProvider(viemClient.transport.url, {
            name: viemClient.chain?.name || "Unknown",
            chainId,
        }),
    });
}
export async function getRoute(chainId, amountIn, inToken, outToken, from) {
    const router = await getRouter(chainId);
    const options = {
        recipient: from,
        slippageTolerance: new Percent(100, 10000),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        type: SwapType.SWAP_ROUTER_02,
    };
    return router.route(CurrencyAmount.fromRawAmount(inToken, amountIn.toString()), outToken, TradeType.EXACT_INPUT, options);
}
