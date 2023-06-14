import { BigNumber, Wallet, ethers } from "ethers";
import { formatEther, parseUnits } from "ethers/lib/utils.js";
import { useCallback, useState } from "react";
import { Result } from "../types";

const ticksToDate = (ticks: number) => {
  const epochTicks = BigInt("621355968000000000");
  const unixMilliseconds = BigInt((BigInt(ticks) - epochTicks) / BigInt(10000));
  const date = new Date(Number(unixMilliseconds));

  return date;
};

export const useSelfTransactions = ({
  initialProvider,
  initialWallet,
  rpcUrls,
  loops,
  delay = 13,
}: {
  initialProvider: ethers.providers.JsonRpcProvider;
  initialWallet: Wallet;
  rpcUrls: string[];
  loops: number;
  delay: number;
}) => {
  const [results, setResults] = useState<Result[]>([]);

  const sendSelfTransactions = useCallback(
    async ({
      wallet,
      gasPrice,
      maxFee,
      provider,
      onResult,
      i,
      label,
    }: {
      wallet: Wallet;
      gasPrice?: BigNumber;
      maxFee: BigNumber;
      provider: ethers.providers.JsonRpcProvider;
      onResult: (args: Result) => void;
      i: number;
      label: string;
    }) => {
      try {
        console.log(`Building transaction ${i + 1} from ${wallet.address}`);
        const tx = {
          to: wallet.address,
          from: wallet.address,
          value: 0,
          gasLimit: "21000",
          maxPriorityFeePerGas: maxFee,
          maxFeePerGas: gasPrice,
        };

        const txRequest = await wallet
          .connect(initialProvider)
          .populateTransaction(tx);
        console.log(txRequest);
        const signedTx = await wallet.signTransaction(txRequest);
        console.log(signedTx);
        const txHash = await provider.send("eth_sendRawTransaction", [
          signedTx,
        ]);
        console.log(
          `Transaction ${i + 1} from ${wallet.address}: ${txHash} (${label})`
        );

        const txReceipt = await initialProvider.waitForTransaction(txHash);
        const block = await initialProvider.getBlockWithTransactions(
          txReceipt.blockNumber
        );
        const index = block.transactions.findIndex((x) => x.hash === txHash);

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
          .filter(Boolean) as Result["firstSeen"];

        const result = `Transaction ${i + 1} from ${
          wallet.address
        } was included in block ${txReceipt.blockNumber} with order ${
          index + 1
        } (${label})`;

        onResult({
          iteration: i + 1,
          wallet: wallet.address,
          tx: txHash,
          blockNumber: txReceipt.blockNumber,
          order: index + 1,
          label,
          firstSeen,
        });

        return result;
      } catch (e) {
        console.log(e);
        const result = `Transaction ${i + 1} from ${
          wallet.address
        } threw an error (${label})`;

        onResult({
          iteration: i + 1,
          wallet: wallet.address,
          tx: "RPC Error",
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
    async (wallets: Wallet[]) => {
      const onResult = (result: Result) => {
        setResults((prevResults) => [...prevResults, result]);
      };

      console.log("Beginning transactions");

      for (let i = 0; i < loops; i++) {
        const promises = [];
        const { lastBaseFeePerGas, maxPriorityFeePerGas } =
          await initialWallet.getFeeData();
        const maxFee = maxPriorityFeePerGas || parseUnits("1", "gwei");
        const gasPrice = lastBaseFeePerGas?.add(maxFee) || undefined;

        console.log("Iteration ", i + 1);
        console.log("Gas", {
          maxFeePerGas: gasPrice ? formatEther(gasPrice) : null,
          maxPriorityFeePerGas: formatEther(maxFee),
        });

        for (let j = 0; j < rpcUrls.length; j++) {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrls[j]);
          promises.push(
            sendSelfTransactions({
              wallet: wallets[j].connect(initialProvider),
              gasPrice,
              maxFee,
              provider,
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
    [
      rpcUrls,
      loops,
      delay,
      sendSelfTransactions,
      initialProvider,
      initialWallet,
    ]
  );

  return {
    results,
    setResults,
    startSelfTransactions,
  };
};
