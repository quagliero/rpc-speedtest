import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const projectId = '8a57e0fb1649abcccce087caa342a7af';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygonMumbai],
  [
    // set default jsonrpc per chain, preferred over publicprovider which is unreliable
    jsonRpcProvider({
      rpc(chain) {
        if (chain.id === polygonMumbai.id) {
          return {
            http: 'https://rpc.ankr.com/polygon_mumbai',
          };
        }

        return {
          http: 'https://rpc.ankr.com/eth',
        };
      },
    }),
    publicProvider(),
  ]
);

const connectors = connectorsForWallets([
  {
    groupName: 'Suggested',
    wallets: [
      injectedWallet({ chains }),
      rabbyWallet({ chains }),
      rainbowWallet({ chains, projectId }),
      metaMaskWallet({ chains, projectId }),
      // walletConnectWallet({ chains, projectId }),
      coinbaseWallet({ chains, appName: 'RPC SpeedTest' }),
    ],
  },
]);

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
