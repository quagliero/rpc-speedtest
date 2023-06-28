import { useCallback, useState } from 'react';
import { PrivateKeyAccountWithKey, Result } from '../types';
import {
  CustomTransport,
  PrivateKeyAccount,
  PublicClient,
  Transaction,
  WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  parseUnits,
  prepareRequest,
} from 'viem';
import type { Chain } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';

const ticksToDate = (ticks: number) => {
  const epochTicks = BigInt('621355968000000000');
  const unixMilliseconds = BigInt((BigInt(ticks) - epochTicks) / BigInt(10000));
  const date = new Date(Number(unixMilliseconds));

  return date;
};

export const useSelfTransactions = ({
  initialProvider,
  initialWallet,
  rpcUrls,
  chain,
  loops,
  delay = 13,
}: {
  initialProvider: PublicClient;
  initialWallet: WalletClient<CustomTransport, Chain, PrivateKeyAccount>;
  chain: Chain;
  rpcUrls: string[];
  loops: number;
  delay: number;
}) => {
  const [results, setResults] = useState<Result[]>([]);

  const sendSelfTransactions = useCallback(
    async ({
      wallet,
      provider,
      onResult,
      chain,
      i,
      label,
    }: {
      wallet: WalletClient<CustomTransport, Chain, PrivateKeyAccountWithKey>;
      provider: PublicClient;
      chain: Chain;
      onResult: (args: Result) => void;
      i: number;
      label: string;
    }) => {
      try {
        console.log(
          `Building transaction ${i + 1} from ${wallet.account?.address}`
        );

        const txRequest = {
          chainId: chain.id,
          gas: 21000n,
          to: wallet.account?.address,
          value: 0n,
        };

        const walletClient = createWalletClient({
          name: `SpeedTest Wallet Client ${i}`,
          account: wallet.account,
          chain,
          transport: custom(provider),
        });

        const signedTx = await walletClient.account.signTransaction(txRequest);
        console.log(signedTx);
        // @TODO https://github.com/wagmi-dev/viem/discussions/785
        // const txHash = await provider.send("eth_sendRawTransaction", [
        //   signedTx,
        // ]);
        const txHash = await walletClient.sendTransaction(txRequest);
        console.log(
          `Transaction ${i + 1} from ${
            wallet.account.address
          }: ${txHash} (${label})`
        );

        const txReceipt = await waitForTransaction({
          hash: txHash,
          chainId: chain.id,
          timeout: 2000,
        }).catch(async (e) => {
          console.log(e);
          return {
            blockNumber: 0n,
          };
        });

        const block = await initialProvider
          .getBlock({
            blockNumber: txReceipt.blockNumber,
            includeTransactions: true,
          })
          .catch((e) => {
            console.log(e);
            return { transactions: [] };
          });

        const index = block.transactions.findIndex(
          (x) => x === txHash || (x as Transaction).hash === txHash
        );

        // fetch block data
        const zeroMevReq = await fetch(
          `https://api.zeromev.org/zmblock/${txReceipt.blockNumber}`
        ).catch((e) => e);
        const zeroMevJson = (await zeroMevReq.json()) as {
          pop: [{ name: string; times: { t: number }[] }];
        };
        // get the matching block
        const zeroMevData =
          zeroMevJson.pop?.filter(
            (x: { times: { t: number }[] }) =>
              x.times.length === block.transactions.length
          ) || [];

        // pull out the first seen dates for different regions
        const firstSeen = zeroMevData
          .map((x) => {
            const ticks = x.times[index]?.t;

            if (ticks) {
              return {
                name: x.name,
                date: ticksToDate(ticks),
              };
            }
          })
          .filter(Boolean) as Result['firstSeen'];

        const result = `Transaction ${i + 1} from ${
          wallet.account.address
        } was included in block ${txReceipt.blockNumber} with order ${
          index + 1
        } (${label})`;

        onResult({
          iteration: i + 1,
          wallet: wallet.account.address,
          tx: txHash,
          blockNumber: Number(txReceipt.blockNumber),
          order: index + 1,
          label,
          firstSeen,
        });

        return result;
      } catch (e) {
        console.log(e);
        const result = `Transaction ${i + 1} from ${
          wallet.account.address
        } threw an error (${label})`;

        onResult({
          iteration: i + 1,
          wallet: wallet.account.address,
          tx: 'RPC Error',
          blockNumber: 0,
          order: Infinity,
          label,
          firstSeen: [],
        });

        return result;
      }
    },
    [initialProvider]
  );

  const startSelfTransactions = useCallback(
    async (wallets: PrivateKeyAccountWithKey[]) => {
      const onResult = (result: Result) => {
        setResults((prevResults) => [...prevResults, result]);
      };

      console.log('Beginning transactions');

      for (let i = 0; i < loops; i++) {
        const promises = [];
        console.log('Iteration ', i + 1);

        for (let j = 0; j < rpcUrls.length; j++) {
          promises.push(
            sendSelfTransactions({
              chain,
              wallet: createWalletClient({
                account: wallets[j],
                chain,
                transport: custom(initialProvider),
              }),
              provider: createPublicClient({
                chain,
                transport: http(rpcUrls[j]),
              }),
              onResult,
              i,
              label: rpcUrls[j],
            })
          );
        }

        await Promise.all(promises);

        if (i < loops - 1) {
          // Wait for [delay] seconds before starting the next iteration, but not after the last one
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }
      }
    },
    [rpcUrls, loops, delay, sendSelfTransactions, initialProvider, chain]
  );

  return {
    results,
    setResults,
    startSelfTransactions,
  };
};
