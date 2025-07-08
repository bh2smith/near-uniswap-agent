import {
  AlphaRouter,
  CurrencyAmount,
  SwapRoute,
} from "@uniswap/smart-order-router";
import { SwapOptionsSwapRouter02, SwapType } from "@uniswap/smart-order-router";
import { Percent, Token, TradeType } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { Address } from "viem";
import { getRpcUrl } from "../rpc";

export async function getRouter(chainId: number) {
  const rpcUrl = getRpcUrl(chainId);
  return new AlphaRouter({
    chainId,
    provider: new ethers.providers.JsonRpcProvider(rpcUrl, {
      // this seems irrelevant, but it's required by ethers
      name: "Chain " + chainId,
      chainId,
    }),
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
  const options: SwapOptionsSwapRouter02 = {
    recipient: from,
    slippageTolerance: new Percent(100, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  try {
    return router.route(
      CurrencyAmount.fromRawAmount(inToken, amountIn.toString()),
      outToken,
      TradeType.EXACT_INPUT,
      options,
    );
  } catch (error) {
    // Couldn't find route.
    console.error(String(error));
    return null;
  }
}
