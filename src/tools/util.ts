import { Address, getAddress } from "viem";
import { SUPPORTED_CHAIN_IDS } from "../constants";
import {
  BlockchainMapping,
  loadTokenMap,
  checkAllowance,
  erc20Approve,
  MetaTransaction,
} from "@bitte-ai/agent-sdk/evm";

// CoW (and many other Dex Protocols use this to represent native asset).
export const NATIVE_ASSET = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function sellTokenApprovalTx(args: {
  from: string;
  fromTokenAddress: string;
  spender: Address;
  chainId: number;
  sellAmount: string;
}): Promise<MetaTransaction | null> {
  const {
    from,
    fromTokenAddress: sellToken,
    chainId,
    sellAmount,
    spender,
  } = args;
  console.log(
    `Checking approval for account=${from}, token=${sellToken} on chainId=${chainId}`,
  );
  const allowance = await checkAllowance(
    chainId,
    getAddress(from),
    getAddress(sellToken),
    spender,
  );

  if (allowance < BigInt(sellAmount)) {
    // Insufficient allowance
    return erc20Approve({
      token: getAddress(sellToken),
      spender,
    });
  }
  return null;
}

export function isNativeAsset(token: string): boolean {
  return token.toLowerCase() === NATIVE_ASSET.toLowerCase();
}

export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}

let tokenMapInstance: BlockchainMapping | null = null;

export async function getTokenMap(): Promise<BlockchainMapping> {
  if (tokenMapInstance) {
    return tokenMapInstance;
  }
  console.log("Loading TokenMap...");
  tokenMapInstance = await loadTokenMap(SUPPORTED_CHAIN_IDS);
  return tokenMapInstance;
}
