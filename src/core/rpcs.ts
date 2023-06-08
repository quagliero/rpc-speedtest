import { mainnet } from "wagmi";
import { polygonMumbai } from "wagmi/chains";

// Used for speed testing defaults
export const RPC_URLS = {
  [mainnet.id]: [
    "https://rpc.ankr.com/eth",
    "https://eth.llamarpc.com/",
    "https://api.securerpc.com/v1",
    "https://rpc.flashbots.net/",
    "https://api.edennetwork.io/v1/rocket",
    "https://eth.rpc.blxrbdn.com/",
  ],
  [polygonMumbai.id]: [
    "https://polygon-mumbai.blockpi.network/v1/rpc/public",
    "https://polygon-testnet.public.blastapi.io",
    "https://rpc.ankr.com/polygon_mumbai",
  ],
};

// used for wallet seeding txs
export const DEFAULT_RPC_URL = {
  [mainnet.id]: "https://rpc.ankr.com/eth",
  [polygonMumbai.id]: "https://rpc.ankr.com/polygon_mumbai",
};
