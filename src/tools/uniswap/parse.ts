import { Address, erc20Abi, formatUnits, parseUnits } from "viem";
import {
  getTokenDetails,
  BlockchainMapping,
  TokenInfo,
} from "@bitte-ai/agent-sdk";
import { getViemClient } from "../rpc";

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
  const amount = parseUnits(sellAmount, sellTokenData.decimals);
  const { sufficient, balance } = await sufficientSellTokenBalance(
    chainId,
    sender,
    sellTokenData,
    amount,
  );
  if (!sufficient) {
    const have = balance
      ? formatUnits(balance, sellTokenData.decimals)
      : "unknown";
    throw new Error(
      `Insufficient SellToken Balance: Have ${have} - Need ${sellAmount}`,
    );
  }
  return {
    chainId,
    quoteRequest: {
      sellToken: sellTokenData.address,
      buyToken: buyTokenData.address,
      amount,
      walletAddress: sender,
    },
  };
}

export async function sufficientSellTokenBalance(
  chainId: number,
  wallet: Address,
  token: TokenInfo,
  sellAmount: bigint,
): Promise<{ sufficient: boolean; balance: bigint | null }> {
  try {
    const balance = await getViemClient(chainId).readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [wallet],
    });
    const sufficient = balance >= sellAmount;
    return { sufficient, balance };
  } catch (error) {
    console.error(
      `Couldn't read wallet balance for token ${token.address} assuming sufficient: ${error}`,
    );
    return { sufficient: true, balance: null };
  }
}
