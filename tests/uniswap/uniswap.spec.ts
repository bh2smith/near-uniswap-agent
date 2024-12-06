import { orderRequestFlow } from "@/src/app/api/tools/uniswap/orderFlow";
import { getZerionKey, OrderKind } from "@/src/app/api/tools/util";
import { getSafeBalances } from "@bitteprotocol/agent-sdk";
import { getAddress } from "viem";

// Safe Associated with max-normal.near on Bitte Wallet.
const DEPLOYED_SAFE = getAddress("0x54F08c27e75BeA0cdDdb8aA9D69FD61551B19BbA");

const chainId = 8453; // BASE
const quoteRequest = {
  chainId,
  walletAddress: DEPLOYED_SAFE,
  sellToken: getAddress("0x4200000000000000000000000000000000000006"), // WETH
  buyToken: getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"), // USDC
  receiver: DEPLOYED_SAFE,
  kind: OrderKind.SELL,
  amount: 2000000000000000n,
};

describe("Uniswap Plugin", () => {
  // Swaps 0.1 COW to WXDAI on Gnosis Chain using Uniswap API
  it.skip("orderRequestFlow", async () => {
    console.log("Requesting Quote...");
    const signRequest = await orderRequestFlow({
      chainId,
      quoteRequest: { ...quoteRequest },
    });
    console.log(JSON.stringify(signRequest, null, 2));
    console.log(
      `https://wallet.bitte.ai/sign-evm?evmTx=${encodeURI(JSON.stringify(signRequest.transaction))}`,
    );
  }, 10000);

  it.only("getSafeBalances", async () => {
    console.log("Requesting Balances...");
    const balances = await getSafeBalances(
      chainId,
      DEPLOYED_SAFE,
      getZerionKey(),
    );
    console.log(JSON.stringify(balances, null, 2));
  }, 10000);
});
