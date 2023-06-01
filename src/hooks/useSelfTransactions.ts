import { BigNumber, Wallet, ethers } from "ethers";
import { formatEther, parseUnits } from "ethers/lib/utils.js";
import { useCallback, useState } from "react";

const ticksToDate = (ticks: number) => {
  const epochTicks = BigInt("621355968000000000");
  const unixMilliseconds = BigInt((BigInt(ticks) - epochTicks) / BigInt(10000));
  const date = new Date(Number(unixMilliseconds));

  return date;
};

type Result = {
  iteration: number;
  wallet: string;
  blockNumber: number;
  order: number;
  tx: string;
  label: string;
  firstSeen: { name: string; date: Date }[];
};
export const useSelfTransactions = (
  initialProvider: ethers.providers.JsonRpcProvider,
  initialWallet: Wallet,
  providerUrls: string[],
  loopAmount: number
) => {
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
      const txHash = await provider.send("eth_sendRawTransaction", [signedTx]);
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

      console.log(result);

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
    },
    [initialProvider]
  );

  const startSelfTransactions = useCallback(
    async (wallets: Wallet[]) => {
      const onResult = (result: Result) => {
        setResults((prevResults) => [...prevResults, result]);
      };

      console.log("Beginning transactions");

      for (let i = 0; i < loopAmount; i++) {
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

        for (let j = 0; j < providerUrls.length; j++) {
          const provider = new ethers.providers.JsonRpcProvider(
            providerUrls[j]
          );
          const isEven = i % 2 === 0 || i === 0;

          promises.push(
            sendSelfTransactions({
              wallet: wallets[j].connect(initialProvider),
              gasPrice,
              maxFee,
              provider,
              onResult,
              i,
              label: providerUrls[j],
            })
          );

          // alternate the order the promises are dispatched
          // so both get sent 'first' half of the time
          if (isEven) {
            promises.reverse();
          }
        }

        await Promise.all(promises);

        if (i < loopAmount - 1) {
          // Wait for 13 seconds before starting the next iteration, but not after the last one
          await new Promise((resolve) => setTimeout(resolve, 13 * 1000));
        }
      }
    },
    [
      providerUrls,
      loopAmount,
      sendSelfTransactions,
      initialProvider,
      initialWallet,
    ]
  );

  return {
    results,
    startSelfTransactions,
  };
};
