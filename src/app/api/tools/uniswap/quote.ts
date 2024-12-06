import {
  AlphaRouter,
  CurrencyAmount,
  SwapRoute,
} from "@uniswap/smart-order-router";
import { SwapOptionsSwapRouter02, SwapType } from "@uniswap/smart-order-router";
import { Percent, Token, TradeType } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { getClient } from "near-safe";
import { Address } from "viem";

export async function getRouter(chainId: number) {
  const rpcUrl = getClient(chainId).transport.url;
  return new AlphaRouter({
    chainId,
    // Uniswap uses ethers v5.7.0: So dumb
    provider: new ethers.providers.JsonRpcProvider(rpcUrl),
  });
}

export async function getRoute(
  chainId: number,
  amountIn: bigint,
  inToken: Token,
  outToken: Token,
  from: Address,
): Promise<SwapRoute | null> {
  const router = await getRouter(chainId);
  console.log("Got Router:");
  const options: SwapOptionsSwapRouter02 = {
    recipient: from,
    slippageTolerance: new Percent(100, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };
  // const rawTokenAmountIn = parseUnits(amountIn, inToken.decimals);
  console.log("Getting Route:", inToken, outToken, amountIn);
  return router.route(
    CurrencyAmount.fromRawAmount(inToken, amountIn.toString()),
    outToken,
    TradeType.EXACT_INPUT,
    options,
  );
}
