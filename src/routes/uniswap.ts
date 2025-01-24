import { orderRequestFlow } from "../tools/uniswap/orderFlow";
import {
  // getSafeSaltNonce,
  getTokenMap,
  getZerionKey,
  // validateExpressRequest,
} from "../tools/util";
import { parseQuoteRequest } from "../tools/uniswap/parse";
import { Router, Request, Response } from "express";
import { handleRequest, TxData } from "@bitte-ai/agent-sdk";

const router = Router();

async function logic(req: Request): Promise<TxData> {
  const parsedRequest = await parseQuoteRequest(
    req,
    await getTokenMap(),
    getZerionKey(),
  );
  console.log("POST Request for quote:", parsedRequest);
  return orderRequestFlow(parsedRequest);
}

router.post("/", async (req: Request, res: Response) => {
  return handleRequest(req, logic, (x) => res.status(200).json(x));
});

export { router as uniswapRouter };
