import { Address, getAddress, isAddress, parseUnits } from "viem";
import {
  getTokenDetails,
  TokenInfo,
  getSafeBalances,
  TokenBalance,
  BlockchainMapping,
} from "@bitte-ai/agent-sdk";
import { NATIVE_ASSET } from "../util";
export type QuoteParams = {
  sellToken: Address;
  buyToken: Address;
  amount: bigint;
  walletAddress: Address;
};

export interface ParsedQuoteRequest {
  quoteRequest: QuoteParams;
  chainId: number;
}

type QuoteRequestBody = {
  sellToken: string;
  buyToken: string;
  chainId: number;
  sellAmountBeforeFee: string;
  safeAddress: Address;
};

// Define a looser request type
type LooseRequest = {
  body: QuoteRequestBody;
};

export async function parseQuoteRequest(
  req: LooseRequest,
  tokenMap: BlockchainMapping,
  zerionKey?: string,
): Promise<ParsedQuoteRequest> {
  // TODO - Add Type Guard on Request (to determine better if it needs processing below.)
  const requestBody = req.body;
  console.log("Raw Request Body:", requestBody);
  // TODO: Validate input with new validation tools:
  const {
    sellToken,
    buyToken,
    chainId,
    sellAmountBeforeFee: sellAmount,
    safeAddress: sender,
  } = requestBody;
  console.log(
    `TokenMap for ${chainId} has ${Object.keys(tokenMap[chainId]).length} entries`,
  );
  if (sellAmount === "0") {
    throw new Error("Sell amount cannot be 0");
  }

  const [balances, buyTokenData] = await Promise.all([
    getSafeBalances(chainId, sender, zerionKey),
    getTokenDetails(chainId, buyToken, tokenMap),
  ]);
  const sellTokenData = sellTokenAvailable(balances, sellToken);
  if (!buyTokenData) {
    throw new Error(`Buy Token not found ${buyToken}`);
  }
  return {
    chainId,
    quoteRequest: {
      sellToken: sellTokenData.address,
      buyToken: buyTokenData.address,
      amount: parseUnits(sellAmount, sellTokenData.decimals),
      walletAddress: sender,
    },
  };
}

function sellTokenAvailable(
  balances: TokenBalance[],
  sellTokenSymbolOrAddress: string,
): TokenInfo {
  let balance: TokenBalance | undefined;
  if (isAddress(sellTokenSymbolOrAddress, { strict: false })) {
    balance = balances.find(
      (b) =>
        getAddress(b.tokenAddress || NATIVE_ASSET) ===
        getAddress(sellTokenSymbolOrAddress),
    );
  } else {
    balance = balances.find(
      (b) =>
        b.token?.symbol.toLowerCase() ===
        sellTokenSymbolOrAddress.toLowerCase(),
    );
  }
  if (balance) {
    return {
      address: getAddress(balance.tokenAddress || NATIVE_ASSET),
      decimals: balance.token?.decimals || 18,
      symbol: balance.token?.symbol || "UNKNOWN",
    };
  }
  throw new Error("Sell token not found in balances");
}
