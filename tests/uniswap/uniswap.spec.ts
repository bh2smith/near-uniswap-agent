import { getAddress } from "viem";
import { orderRequestFlow } from "../../src/tools/uniswap/orderFlow";
import { parseQuoteRequest } from "../../src/tools/uniswap/parse";
import { getTokenMap } from "../../src/tools/util";

// Safe Associated with max-normal.near on Bitte Wallet.
const DEPLOYED_SAFE = getAddress("0x54F08c27e75BeA0cdDdb8aA9D69FD61551B19BbA");

const chainId = 10; // BASE
const rawQuote = {
  chainId,
  safeAddress: DEPLOYED_SAFE,
  sellToken: "USDC",
  buyToken: "USDT",
  sellAmountBeforeFee: "0.5",
};

describe("Uniswap Plugin", () => {
  // Swaps 1 USDC to WETH on BASE Chain using Uniswap API
  it("orderRequestFlow", async () => {
    const quoteRequest = await parseQuoteRequest(
      { body: { ...rawQuote } },
      await getTokenMap(),
    );
    console.log("Quote Request", quoteRequest);
    const signRequest = await orderRequestFlow(quoteRequest);
    console.log(JSON.stringify(signRequest, null, 2));
    console.log(
      `https://wallet.bitte.ai/sign-evm?evmTx=${encodeURI(JSON.stringify(signRequest.transaction))}`,
    );
  }, 30000);
});
