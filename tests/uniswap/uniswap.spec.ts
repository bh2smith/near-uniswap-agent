import { getAddress } from "viem";
import { orderRequestFlow } from "../../src/tools/uniswap/orderFlow";
import { parseQuoteRequest } from "../../src/tools/uniswap/parse";
import { getTokenMap } from "../../src/tools/util";
import { BlockchainMapping, TokenInfo } from "@bitte-ai/agent-sdk";

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
// type ChainId = number;
// type BlockchainMapping = Record<ChainId, SymbolMapping>;
