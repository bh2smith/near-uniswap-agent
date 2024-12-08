import { orderRequestFlow } from "../tools/uniswap/orderFlow";
import {
  // getSafeSaltNonce,
  getTokenMap,
  getZerionKey,
  // validateExpressRequest,
} from "../tools/util";
import { parseQuoteRequest } from "../tools/uniswap/parse";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  // const headerError = await validateExpressRequest(req, getSafeSaltNonce());
  // if (headerError) return headerError;

  try {
    const parsedRequest = await parseQuoteRequest(
      req,
      await getTokenMap(),
      getZerionKey(),
    );
    console.log("POST Request for quote:", parsedRequest);
    const orderData = await orderRequestFlow(parsedRequest);
    console.log("Responding with", orderData);
    return res.status(200).json(orderData);
  } catch (e: unknown) {
    const message = JSON.stringify(e);
    console.error(message);
    return res.status(400).json({ error: message });
  }
});

export { router as uniswapRouter };
