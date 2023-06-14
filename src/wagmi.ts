import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createClient } from "wagmi";
import { mainnet, polygonMumbai } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, polygonMumbai],
  [
    // set default jsonrpc per chain, preferred over publicprovider which is unreliable
    jsonRpcProvider({
      rpc(chain) {
        if (chain.id === polygonMumbai.id) {
          return {
            http: "https://rpc.ankr.com/polygon_mumbai",
          };
        }

        return {
          http: "https://rpc.ankr.com/eth",
        };
      },
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "RPC Speedtest",
  chains,
});

export const client = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

export { chains };
