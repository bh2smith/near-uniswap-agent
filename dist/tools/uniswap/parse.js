import { getAddress, isAddress, parseUnits } from "viem";
import { getTokenDetails, getSafeBalances, } from "@bitteprotocol/agent-sdk";
import { NATIVE_ASSET } from "../util";
export async function parseQuoteRequest(req, tokenMap, zerionKey) {
    // TODO - Add Type Guard on Request (to determine better if it needs processing below.)
    const requestBody = req.body;
    console.log("Raw Request Body:", requestBody);
    // TODO: Validate input with new validation tools:
    const { sellToken, buyToken, chainId, sellAmountBeforeFee: sellAmount, safeAddress: sender, } = requestBody;
    if (sellAmount === "0") {
        throw new Error("Sell amount cannot be 0");
    }
    const [balances, buyTokenData] = await Promise.all([
        getSafeBalances(chainId, sender, zerionKey),
        getTokenDetails(chainId, buyToken, tokenMap),
    ]);
    const sellTokenData = sellTokenAvailable(balances, sellToken);
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
function sellTokenAvailable(balances, sellTokenSymbolOrAddress) {
    let balance;
    if (isAddress(sellTokenSymbolOrAddress, { strict: false })) {
        balance = balances.find((b) => getAddress(b.tokenAddress || NATIVE_ASSET) ===
            getAddress(sellTokenSymbolOrAddress));
    }
    else {
        balance = balances.find((b) => b.token?.symbol.toLowerCase() ===
            sellTokenSymbolOrAddress.toLowerCase());
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