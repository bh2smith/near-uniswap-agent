import { Network } from "near-safe";

// Alchemy RPC endpoints for different chains
const ALCHEMY_RPC_ENDPOINTS: Record<number, string> = {
  1: "https://eth-mainnet.g.alchemy.com/v2",
  10: "https://opt-mainnet.g.alchemy.com/v2",
  56: "https://bsc-mainnet.g.alchemy.com/v2",
  137: "https://polygon-mainnet.g.alchemy.com/v2",
  8453: "https://base-mainnet.g.alchemy.com/v2",
  42161: "https://arb-mainnet.g.alchemy.com/v2",
  42220: "https://celo-mainnet.g.alchemy.com/v2",
  43114: "https://avax-mainnet.g.alchemy.com/v2",
  81457: "https://blast-mainnet.g.alchemy.com/v2",
};

// Public RPC endpoints as fallback
const PUBLIC_RPC_ENDPOINTS: Record<number, string> = {
  1: "https://eth.llamarpc.com",
  10: "https://optimism.llamarpc.com",
  56: "https://bsc.llamarpc.com",
  137: "https://polygon.llamarpc.com",
  8453: "https://base.llamarpc.com",
  42161: "https://arbitrum.llamarpc.com",
  42220: "https://forno.celo.org",
  43114: "https://avalanche.llamarpc.com",
  81457: "https://rpc.blast.io",
};

function getAlchemyRpcUrl(chainId: number): string | null {
  const alchemyRpc = ALCHEMY_RPC_ENDPOINTS[chainId];
  if (!alchemyRpc) return null;

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.warn("ALCHEMY_API_KEY is not set");
    return null;
  }
  return `${alchemyRpc}/${apiKey}`;
}

export function getRpcUrl(chainId: number): string {
  // First try to get Alchemy RPC with API key
  const alchemyRpc = getAlchemyRpcUrl(chainId);
  if (alchemyRpc) {
    return alchemyRpc;
  }

  // Then try public RPC
  const publicRpc = PUBLIC_RPC_ENDPOINTS[chainId];
  if (publicRpc) {
    return publicRpc;
  }

  // Finally fallback to near-safe Network
  const network = Network.fromChainId(chainId);
  return network.rpcUrl;
}
