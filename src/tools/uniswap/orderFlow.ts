import { SignRequest, MetaTransaction } from "@bitte-ai/types";
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

// https://docs.uniswap.org/sdk/v3/guides/swaps/routing
export async function orderRequestFlow({
  chainId,
  quoteRequest,
}: ParsedQuoteRequest): Promise<{
  transaction: SignRequest;
  meta: { orderData: string };
}> {
  console.log("Quote Request", quoteRequest);
  const metaTransactions: MetaTransaction[] = [];
  if (isNativeAsset(quoteRequest.sellToken)) {
    metaTransactions.push(
      wrapMetaTransaction(chainId, BigInt(quoteRequest.amount)),
    );
    quoteRequest.sellToken = getNativeAsset(chainId).address;
  }
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
  const approvalTx = await sellTokenApprovalTx({
    fromTokenAddress: sellToken.address,
    chainId,
    from: quoteRequest.walletAddress,
    spender: getSwapRouterAddress(chainId),
    sellAmount: quoteRequest.amount.toString(),
  });
  if (approvalTx) {
    console.log("prepending approval");
    // TODO: Update approval address.
    metaTransactions.push(approvalTx);
  }
  const swapTx = {
    to: getSwapRouterAddress(chainId),
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
    meta: { orderData: "Uniswap Order Data" },
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

const swapRouterOverrides: Map<number, string> = new Map([
  [8453, "0x2626664c2603336E57B271c5C0b26F421741e481"], // Base
  [56, "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2"], // BNB Chain
  [1868, "0x7E40dB01736f88464e5f4E42394F3d5bbb6705B9"], // Soneium
  [43114, "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE"], // Avalanche C-Chain
  [42220, "0x5615CDAb10dc425a742d643d949a7F474C01abc4"], // Celo
  [81457, "0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66"], // Blast
]);

function getSwapRouterAddress(chainId: number): Address {
  // https://docs.uniswap.org/contracts/v3/reference/deployments/
  const defaultSwapRouter = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
  return getAddress(swapRouterOverrides.get(chainId) || defaultSwapRouter);
}
