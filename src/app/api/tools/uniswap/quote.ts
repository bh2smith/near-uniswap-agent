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
  const viemClient = getClient(chainId).transport.url;

  const provider = new ethers.providers.StaticJsonRpcProvider(
    viemClient.transport.url,
    {
      name: viemClient.chain.name,
      chainId,
    },
  );

  try {
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, network.chainId);
  } catch (e: unknown) {
    console.error("Failed to connect to network:", e);
    throw new Error(`Network connection failed: ${JSON.stringify(e)}`);
  }

  return new AlphaRouter({
    chainId,
    provider,
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
