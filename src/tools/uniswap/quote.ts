import {
  AlphaRouter,
  CurrencyAmount,
  SwapRoute,
} from "@uniswap/smart-order-router";
import { SwapOptionsSwapRouter02, SwapType } from "@uniswap/smart-order-router";
import { Percent, Token, TradeType } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { Network } from "near-safe";
import { Address } from "viem";

export async function getRouter(chainId: number) {
  const network = Network.fromChainId(chainId);
  return new AlphaRouter({
    chainId,
    provider: new ethers.providers.JsonRpcProvider(network.rpcUrl, {
      name: network.name,
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
  return router.route(
    CurrencyAmount.fromRawAmount(inToken, amountIn.toString()),
    outToken,
    TradeType.EXACT_INPUT,
    options,
  );
}
