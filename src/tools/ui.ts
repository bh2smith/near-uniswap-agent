import { getClientForChain } from "@bitte-ai/agent-sdk/evm";
import { Currency, CurrencyAmount, Token } from "@uniswap/sdk-core";

interface SwapDetails {
  chainId: number;
  // route: SwapRoute; // TODO: There is a lot more data that can be parsed out of the route for UI purposes!
  input: CurrencyAmount<Currency>;
  output: CurrencyAmount<Currency>;
}

export function parseWidgetData({
  chainId,
  input,
  output,
}: SwapDetails): object {
  const chain = getClientForChain(chainId).chain!;

  return {
    network: {
      name: chain.name,
      icon: "",
    },
    type: "swap",
    fee: "0",
    tokenIn: basicCurrencyInfo(input),
    tokenOut: basicCurrencyInfo(output),
  };
}

function basicCurrencyInfo(amount: CurrencyAmount<Currency>): object {
  // TODO (bh2smith): wont work for native assets.
  if (amount.currency.isNative) {
    throw new Error("Native Assets Currently Unsupported");
  }
  const token = amount.currency as Token;
  return {
    contractAddress: token.address,
    amount: amount.toExact(),
    usdValue: 0,
    name: token.name || token.symbol!,
    symbol: token.symbol!,
    decimals: token.decimals,
  };
}
