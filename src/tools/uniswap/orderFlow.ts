import { SignRequest, MetaTransaction, SwapFTData } from "@bitte-ai/types";
import { ParsedQuoteRequest } from "./parse";
import { Address, erc20Abi, getAddress, Hex } from "viem";
import {
  getNativeAsset,
  signRequestFor,
  wrapMetaTransaction,
} from "@bitte-ai/agent-sdk";
import { getRoute } from "./quote";
import { Token } from "@uniswap/sdk-core";
import { isNativeAsset, sellTokenApprovalTx } from "../util";
import { getViemClient } from "../rpc";
// import { parseWidgetData } from "../ui";

// https://docs.uniswap.org/sdk/v3/guides/swaps/routing
export async function orderRequestFlow({
  chainId,
  quoteRequest,
}: ParsedQuoteRequest): Promise<{
  transaction: SignRequest;
  meta: { ui?: SwapFTData };
}> {
  console.log("Quote Request", quoteRequest);
  const [sellToken, buyToken] = await Promise.all([
    getToken(chainId, quoteRequest.sellToken),
    getToken(chainId, quoteRequest.buyToken),
  ]);
  console.log(`Seeking Route for ${sellToken.symbol} --> ${buyToken.symbol}`);
  const route = await getRoute(
    chainId,
    quoteRequest.amount,
    sellToken,
    buyToken,
    quoteRequest.walletAddress,
  );
  if (!route || !route.methodParameters) {
    const message = `Failed to get route on ${chainId} for quoteRequest`;
    console.error(message);
    throw new Error(message);
  }
  console.log("Route found!");
  const routerAddress = getAddress(route.methodParameters.to);

  const metaTransactions: MetaTransaction[] = [];
  if (isNativeAsset(quoteRequest.sellToken)) {
    metaTransactions.push(
      wrapMetaTransaction(chainId, BigInt(quoteRequest.amount)),
    );
    quoteRequest.sellToken = getNativeAsset(chainId).address;
  }
  const approvalTx = await sellTokenApprovalTx({
    fromTokenAddress: sellToken.address,
    chainId,
    from: quoteRequest.walletAddress,
    spender: routerAddress,
    sellAmount: quoteRequest.amount.toString(),
  });
  if (approvalTx) {
    console.log("prepending approval");
    // TODO: Update approval address.
    metaTransactions.push(approvalTx);
  }
  const swapTx = {
    to: routerAddress,
    data: route.methodParameters.calldata as Hex,
    value: route.methodParameters.value as Hex,
  };
  console.log("swapTx", JSON.stringify(swapTx, null, 2));
  metaTransactions.push(swapTx);
  return {
    transaction: signRequestFor({
      chainId,
      from: getAddress(quoteRequest.walletAddress),
      metaTransactions,
    }),
    meta: {
      //   ui: parseWidgetData({
      //     chainId,
      //     input: route.trade.inputAmount,
      //     output: route.trade.outputAmount,
      //   }),
    },
  };
}

export async function getToken(
  chainId: number,
  address: Address,
): Promise<Token> {
  const client = getViemClient(chainId);
  const [decimals, symbol, name] = await Promise.all([
    client.readContract({
      abi: erc20Abi,
      address,
      functionName: "decimals",
    }),
    client.readContract({
      abi: erc20Abi,
      address,
      functionName: "symbol",
    }),
    client.readContract({
      abi: erc20Abi,
      address,
      functionName: "name",
    }),
  ]);
  return new Token(chainId, address, decimals, symbol, name);
}
