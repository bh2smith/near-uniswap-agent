import { type NextRequest, NextResponse } from "next/server";
import { orderRequestFlow } from "./orderFlow";
import { getZerionKey, validateNextRequest } from "../util";
import { parseQuoteRequest } from "./parse";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headerError = await validateNextRequest(req);
  if (headerError) return headerError;

  try {
    const parsedRequest = await parseQuoteRequest(
      req,
      await getTokenMap(),
      getZerionKey(),
    );
    console.log("POST Request for quote:", parsedRequest);
    const orderData = await orderRequestFlow(parsedRequest);
    console.log("Responding with", orderData);
    return NextResponse.json(orderData, { status: 200 });
  } catch (e: unknown) {
    const message = JSON.stringify(e);
    console.error(message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
function getTokenMap():
  | import("@bitteprotocol/agent-sdk").BlockchainMapping
  | PromiseLike<import("@bitteprotocol/agent-sdk").BlockchainMapping> {
  throw new Error("Function not implemented.");
}
