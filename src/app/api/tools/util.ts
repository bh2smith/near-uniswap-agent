import { NextRequest, NextResponse } from "next/server";
import {
  BlockchainMapping,
  loadTokenMap,
  validateRequest,
} from "@bitteprotocol/agent-sdk";
import { Address, getAddress } from "viem";
import { MetaTransaction } from "near-safe";
import { checkAllowance, erc20Approve } from "@bitteprotocol/agent-sdk";
import { unstable_cache } from "next/cache";

export async function validateNextRequest(
  req: NextRequest,
  safeSaltNonce?: string,
): Promise<NextResponse | null> {
  return validateRequest<NextRequest, NextResponse>(
    req,
    safeSaltNonce || "0",
    (data: unknown, init?: { status?: number }) =>
      NextResponse.json(data, init),
  );
}

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
    getAddress(from),
    getAddress(sellToken),
    spender,
    chainId,
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

export enum OrderKind {
  BUY = "buy",
  SELL = "sell",
}

export function applySlippage(
  order: { kind: OrderKind; buyAmount: string; sellAmount: string },
  bps: number,
): { buyAmount?: string; sellAmount?: string } {
  const scaleFactor = BigInt(10000);
  if (order.kind === OrderKind.SELL) {
    const slippageBps = BigInt(10000 - bps);
    return {
      buyAmount: (
        (BigInt(order.buyAmount) * slippageBps) /
        scaleFactor
      ).toString(),
    };
  } else if (order.kind === OrderKind.BUY) {
    const slippageBps = BigInt(10000 + bps);
    return {
      sellAmount: (
        (BigInt(order.sellAmount) * slippageBps) /
        scaleFactor
      ).toString(),
    };
  }
  return order;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}
export function getZerionKey(): string {
  return getEnvVar("ZERION_KEY");
}

export function getSafeSaltNonce(): string {
  const bitteProtocolSaltNonce = "130811896738364156958237239906781888512";
  return process.env.SAFE_SALT_NONCE || bitteProtocolSaltNonce;
}

export async function getTokenMap(): Promise<BlockchainMapping> {
  const getCachedTokenMap = unstable_cache(
    async () => {
      console.log("Loading TokenMap...");
      return loadTokenMap(getEnvVar("TOKEN_MAP_URL"));
    },
    ["token-map"], // cache key
    {
      revalidate: 86400, // revalidate 24 hours
      tags: ["token-map"],
    },
  );
  return getCachedTokenMap();
}
