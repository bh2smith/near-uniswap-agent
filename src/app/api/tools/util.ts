import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@bitteprotocol/agent-sdk";
import { Address, getAddress } from "viem";
import { MetaTransaction } from "near-safe";
import { checkAllowance, erc20Approve } from "@bitteprotocol/agent-sdk";

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
