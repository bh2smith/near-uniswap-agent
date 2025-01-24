import {
  addressField,
  FieldParser,
  getSafeBalances,
  handleRequest,
  numberField,
  validateInput,
  TokenBalance,
} from "@bitte-ai/agent-sdk";
import { Address } from "viem";
import { Router, Request, Response } from "express";

import { getZerionKey } from "../tools/util";

interface Input {
  chainId: number;
  safeAddress: Address;
}

const parsers: FieldParser<Input> = {
  chainId: numberField,
  safeAddress: addressField,
};

async function logic(req: Request): Promise<TokenBalance[]> {
  // Prevent unauthorized spam for balance API.
  const search = new URLSearchParams(
    Object.entries(req.query).map(([k, v]) => [k, v as string]),
  );
  console.log("Request: balances/", search);
  const { chainId, safeAddress } = validateInput<Input>(search, parsers);
  const balances = await getSafeBalances(chainId, safeAddress, getZerionKey());
  console.log(`Retrieved ${balances.length} balances for ${safeAddress}`);
  return balances;
}

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  return handleRequest(req, logic, (x) => res.status(200).json(x));
});

export { router as balancesRouter };
