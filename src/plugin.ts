import {
  addressOrSymbolParam,
  addressParam,
  AddressSchema,
  chainIdParam,
  MetaTransactionSchema,
  SignRequestResponse200,
  SignRequestSchema,
} from "@bitte-ai/agent-sdk";
import { config } from "dotenv";
config();

const url = "https://near-uniswap-agent.vercel.app";

export const pluginData = {
  openapi: "3.0.0",
  info: {
    title: "Bitte Uniswap Agent",
    description: "API for interactions with Uniswap V3",
    version: "1.0.1",
  },
  servers: [{ url }],
  "x-mb": {
    "account-id": "max-normal.near",
    assistant: {
      name: "Uniswap Assistant",
      description:
        "An assistant that generates transaction data for Uniswap V3 Interactions",
      instructions:
        "Encodes transactions as signature requests on EVM networks. This assistant is only for EVM networks. Passes the the transaction fields of the response to generate-evm-tx tool for signing and displays the meta content of the response to the user after signing. For selling native assets, such as ETH, xDAI, POL, BNB it uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE as the sellToken. It does not infer the chainId. Do not infer the token decimals. Use Token Units for sellAmountBeforeFee. Uses token symbols for sellToken and buyToken unless addresses are provided. Always passes connected wallet as evmAddress on any request requiring evmAddress.",
      tools: [{ type: "generate-evm-tx" }],
      image: `${url}/uniswap.svg`,
      categories: ["defi"],
      chainIds: [
        1, // Mainnet
        10, // Optimism
        56, // Binance Smart Chain (BSC)
        137, // Polygon
        1868, // Soneium
        8453, // Base (Coinbase L2)
        42161, // Arbitrum One
        42220, // CELO
        43114, // Avalanche
        81457, // Blast
      ],
    },
  },
  paths: {
    "/api/tools/uniswap": {
      post: {
        tags: ["uniswap"],
        operationId: "swap",
        summary:
          "Quote a price and fee for the specified order parameters. Posts unsigned order to Uniswap and returns Signable payload",
        description:
          "Given a partial order compute the minimum fee and a price estimate for the order. Return a full order that can be used directly for signing, and with an included signature, passed directly to the order creation endpoint.",
        parameters: [
          { $ref: "#/components/parameters/chainId" },
          { $ref: "#/components/parameters/evmAddress" },
          { $ref: "#/components/parameters/sellToken" },
          { $ref: "#/components/parameters/buyToken" },
          { $ref: "#/components/parameters/receiver" },
          { $ref: "#/components/parameters/sellAmount" },
        ],
        responses: {
          "200": { $ref: "#/components/responses/SignRequestResponse200" },
          "400": {
            description: "Error quoting order.",
          },
          "404": {
            description: "No route was found for the specified order.",
          },
          "429": {
            description: "Too many order quotes.",
          },
          "500": {
            description: "Unexpected error quoting an order.",
          },
        },
      },
    },
  },
  components: {
    parameters: {
      chainId: chainIdParam,
      address: addressParam,
      sellAmount: {
        in: "query",
        required: true,
        schema: {
          type: "string",
        },
        name: "sellAmount",
        description:
          "The amount of tokens to sell before fees, represented as a decimal string in token units. Not Atoms.",
      },
      evmAddress: {
        ...addressParam,
        name: "evmAddress",
        description: "address of connected wallet.",
      },
      receiver: {
        ...addressParam,
        name: "receiver",
        description:
          "The address to receive the proceeds of the trade, instead of the sender's address.",
      },
      buyToken: {
        ...addressOrSymbolParam,
        name: "buyToken",
        description: "Token to be bought.",
      },
      sellToken: {
        ...addressOrSymbolParam,
        name: "sellToken",
        description: "Token to be sold.",
      },
    },
    responses: {
      SignRequestResponse200,
      BadRequest400: {
        description: "Bad Request - Invalid or missing parameters",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: {
                  type: "boolean",
                  example: false,
                },
                message: {
                  type: "string",
                  example: "Missing required parameters: chainId or amount",
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      Address: AddressSchema,
      SignRequest: SignRequestSchema,
      MetaTransaction: MetaTransactionSchema,
    },
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true,
  },
};
