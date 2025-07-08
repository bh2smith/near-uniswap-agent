import { getAddress } from "viem";
import { orderRequestFlow } from "../../src/tools/uniswap/orderFlow";
import { parseQuoteRequest } from "../../src/tools/uniswap/parse";
import { getTokenMap } from "../../src/tools/util";
import { parseWidgetData } from "../../src/tools/ui";
import { BlockchainMapping, TokenInfo } from "@bitte-ai/agent-sdk";
import { Currency, CurrencyAmount } from "@uniswap/sdk-core";

// Safe Associated with max-normal.near on Bitte Wallet.
const DEPLOYED_SAFE = getAddress("0x54F08c27e75BeA0cdDdb8aA9D69FD61551B19BbA");

const chainId = 1868; // Soneium
const rawQuote = {
  chainId,
  evmAddress: DEPLOYED_SAFE,
  sellToken: "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441", // ASTR
  buyToken: "0x4200000000000000000000000000000000000006", // WETH
  sellAmount: "10",
};

describe("Uniswap Plugin", () => {
  it.skip("orderRequestFlow", async () => {
    const tokenMap = await fetchMinimalTopTokens(chainId, 50);
    const quoteRequest = await parseQuoteRequest(
      { body: { ...rawQuote } },
      tokenMap,
    );
    const signRequest = await orderRequestFlow(quoteRequest);
    console.log(JSON.stringify(signRequest, null, 2));
  }, 30000);

  it("uiData", async () => {
    const astr = {
      currency: {
        chainId: 1868,
        decimals: 18,
        symbol: "ASTR",
        name: "Astar Token",
        address: "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441",
      },
      toExact: () => "1.23",
    };

    const weth = {
      currency: {
        chainId: 1868,
        decimals: 18,
        symbol: "WETH",
        name: "Wrapped Ether",
        isToken: true,
        address: "0x4200000000000000000000000000000000000006",
      },
      toExact: () => "0.0012",
    };
    const ui = parseWidgetData({
      chainId,
      input: astr as unknown as CurrencyAmount<Currency>,
      output: weth as unknown as CurrencyAmount<Currency>,
    });
    console.log(JSON.stringify(ui, null, 2));
    expect(ui).toEqual({
      network: {
        name: "Soneium Mainnet",
        icon: "",
      },
      type: "swap",
      fee: "0",
      tokenIn: {
        contractAddress: "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441",
        amount: "1.23",
        usdValue: 0,
        name: "Astar Token",
        symbol: "ASTR",
        decimals: 18,
      },
      tokenOut: {
        contractAddress: "0x4200000000000000000000000000000000000006",
        amount: "0.0012",
        usdValue: 0,
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
      },
    });
  }, 30000);
});

type MinimalToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
};

async function fetchMinimalTopTokens(
  chainId: number,
  n: number,
): Promise<BlockchainMapping> {
  if (chainId !== 1868) {
    return await getTokenMap();
  }

  const response = await fetch(
    `https://soneium.blockscout.com/api/v2/tokens?sort=circulating_market_cap&order=desc&limit=${n}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.statusText}`);
  }

  const data = await response.json();

  const tokens: MinimalToken[] = data.items
    .filter(
      (token) => parseFloat(token.circulating_market_cap || "0") > 100_000,
    )
    .map((token) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: Number(token.decimals),
    }));

  return toBlockChainMapping(chainId, tokens);
}

function toBlockChainMapping(
  chainId: number,
  tokens: MinimalToken[],
): BlockchainMapping {
  const tokenMap: SymbolMapping = tokens.reduce((acc, token) => {
    acc[token.symbol.toLowerCase()] = {
      ...token,
      address: getAddress(token.address),
    };
    return acc;
  }, {} as SymbolMapping);

  return {
    [chainId]: tokenMap,
  };
}

type SymbolMapping = Record<string, TokenInfo | undefined>;
