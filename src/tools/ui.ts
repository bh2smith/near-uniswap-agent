import type { SwapFTData, TokenInfo } from "@bitte-ai/types";
import { getChainById } from "@bitte-ai/agent-sdk";
import { Currency, CurrencyAmount, Token } from "@uniswap/sdk-core";
import { externalPriceFeed } from "./prices";

interface SwapDetails {
  chainId: number;
  // route: SwapRoute; // TODO: There is a lot more data that can be parsed out of the route for UI purposes!
  input: CurrencyAmount<Currency>;
  output: CurrencyAmount<Currency>;
}

export async function parseWidgetData({
  chainId,
  input,
  output,
}: SwapDetails): Promise<SwapFTData> {
  const chain = getChainById(chainId);

  return {
    network: {
      name: chain.name,
      icon: "",
    },
    type: "swap",
    fee: "0",
    tokenIn: await basicCurrencyInfo(input),
    tokenOut: await basicCurrencyInfo(output),
  };
}

async function basicCurrencyInfo(
  amount: CurrencyAmount<Currency>,
): Promise<TokenInfo> {
  // TODO (bh2smith): wont work for native assets.
  if (amount.currency.isNative) {
    throw new Error("Native Assets Currently Unsupported");
  }
  const token = amount.currency as Token;
  return {
    contractAddress: token.address,
    amount: amount.toExact(),
    usdValue: (await externalPriceFeed({ ...token })) || 0,
    name: token.name || token.symbol!,
    symbol: token.symbol!,
    decimals: token.decimals,
  };
}
