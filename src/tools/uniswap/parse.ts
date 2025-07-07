import { Address, parseUnits } from "viem";
import { getTokenDetails, BlockchainMapping } from "@bitte-ai/agent-sdk";

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
  sellAmount: string;
  evmAddress: Address;
};

// Define a looser request type
type LooseRequest = {
  body: QuoteRequestBody;
};

export async function parseQuoteRequest(
  req: LooseRequest,
  tokenMap: BlockchainMapping,
  // zerionKey?: string,
): Promise<ParsedQuoteRequest> {
  // TODO - Add Type Guard on Request (to determine better if it needs processing below.)
  const requestBody = req.body;
  console.log("Raw Request Body:", requestBody);
  // TODO: Validate input with new validation tools:
  const {
    sellToken,
    buyToken,
    chainId,
    sellAmount,
    evmAddress: sender,
  } = requestBody;
  console.log(
    `TokenMap for ${chainId} has ${Object.keys(tokenMap[chainId]).length} entries`,
  );
  if (sellAmount === "0") {
    throw new Error("Sell amount cannot be 0");
  }

  const [sellTokenData, buyTokenData] = await Promise.all([
    // TODO(bh2smith): Put back Balance check!
    // getBalances(sender, zerionKey),
    getTokenDetails(chainId, sellToken, tokenMap),
    getTokenDetails(chainId, buyToken, tokenMap),
  ]);
  // const sellTokenData = sellTokenAvailable(chainId, balances, sellToken);
  if (!buyTokenData) {
    throw new Error(
      `Buy Token not found '${buyToken}': supply address if known`,
    );
  }
  if (!sellTokenData) {
    throw new Error(
      `Sell Token not found '${sellToken}': supply address if known`,
    );
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

// function sellTokenAvailable(
//   chainId: number,
//   balances: TokenBalance[],
//   sellTokenSymbolOrAddress: string,
// ): TokenInfo {
//   let balance: TokenBalance | undefined;
//   if (isAddress(sellTokenSymbolOrAddress, { strict: false })) {
//     balance = balances.find(
//       (b) =>
//         getAddress(b.tokenAddress || NATIVE_ASSET) ===
//         getAddress(sellTokenSymbolOrAddress),
//     );
//   } else {
//     balance = balances.find(
//       (b) =>
//         b.token?.symbol.toLowerCase() ===
//         sellTokenSymbolOrAddress.toLowerCase(),
//     );
//   }
//   console.log(balances);
//   if (balance) {
//     return {
//       address: getAddress(balance.tokenAddress || NATIVE_ASSET),
//       decimals: balance.token?.decimals || 18,
//       symbol: balance.token?.symbol || "UNKNOWN",
//     };
//   }
//   throw new Error(
//     `Sell token (${sellTokenSymbolOrAddress}) not found in balances: ${balances.map((b) => b.token?.symbol || nativeAssetSymbol(chainId)).join(",")}`,
//   );
// }

// function nativeAssetSymbol(chainId: number): string {
//   return Network.fromChainId(chainId).nativeCurrency.symbol;
// }

// import type { Address } from "viem";
// import type { TokenBalance } from "zerion-sdk";
// import { ZerionAPI, zerionToTokenBalances } from "zerion-sdk";

// export async function getBalances(
//   address: Address,
//   zerionKey: string,
// ): Promise<TokenBalance[]> {
//   try {
//     const zerion = new ZerionAPI(zerionKey);
//     const balances = await zerion.ui.getUserBalances(address, {
//       useStatic: true,
//       options: { hideDust: 0.01 },
//     });
//     return zerionToTokenBalances(balances.tokens);
//   } catch (error) {
//     console.error("Error fetching Zerion balances:", error);
//     return [];
//   }
// }
