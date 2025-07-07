import { orderRequestFlow } from "../tools/uniswap/orderFlow";
import {
  // getSafeSaltNonce,
  getTokenMap,
  getZerionKey,
  // validateExpressRequest,
} from "../tools/util";
import { parseQuoteRequest } from "../tools/uniswap/parse";
import { Router, Request, Response, NextFunction } from "express";
import { handleRequest } from "@bitte-ai/agent-sdk";
import { SignRequest } from "@bitte-ai/types";

const router = Router();

async function logic(
  req: Request,
): Promise<{ transaction: SignRequest; meta: { orderData: string } }> {
  const parsedRequest = await parseQuoteRequest(
    req,
    await getTokenMap(),
    getZerionKey(),
  );
  console.log("POST Request for quote:", parsedRequest);
  const result = await orderRequestFlow(parsedRequest);
  console.log("Order request flow result:", result);
  return result;
}

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  handleRequest(req, logic, (x) => res.status(200).json(x)).catch(next);
});

export { router as uniswapRouter };
