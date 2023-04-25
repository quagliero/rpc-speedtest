import { BigNumber, Wallet, ethers } from "ethers";
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
  providerUrls: string[],
  loopAmount: number
) => {
  const [results, setResults] = useState<Result[]>([]);

  const sendSelfTransactions = useCallback(
    async (
      wallet: Wallet,
      gasPrice: BigNumber,
      provider: ethers.providers.JsonRpcProvider,
      onResult: (args: Result) => void,
      i: number,
      label: string
    ) => {
      console.log(`Building transaction ${i + 1} from ${wallet.address}`);
      const tx = {
        to: wallet.address,
        from: wallet.address,
        value: "0",
        gasLimit: "21000",
        gasPrice,
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

      const zeroMevReq = await fetch(`https://zeromev.org/zmblock/${block}`);
      const zeroMevJson = (await zeroMevReq.json()) as {
        pop: [{ name: string; times: { t: number }[] }];
      };
      const zeroMevData = zeroMevJson.pop?.filter(
        (x: { times: { t: number }[] }) =>
          x.times.length === block.transactions.length
      );
      const dates = zeroMevData.map((x) => {
        return {
          name: x.name,
          date: ticksToDate(x.times[index].t),
        };
      });
      // @TODO figure out what data

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
        firstSeen: dates,
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
        const gasPrice = await initialProvider.getGasPrice();
        console.log("Iteration ", i);

        for (let j = 0; j < providerUrls.length; j++) {
          const provider = new ethers.providers.JsonRpcProvider(
            providerUrls[j]
          );
          const isEven = i % 2 === 0 || i === 0;

          promises.push(
            sendSelfTransactions(
              wallets[j].connect(initialProvider),
              gasPrice,
              provider,
              onResult,
              i,
              providerUrls[j]
            )
          );

          // alternate the order the promises are dispatched
          // so both get sent 'first' half of the time
          if (isEven) {
            promises.reverse();
          }
        }

        await Promise.all(promises);

        if (i < loopAmount - 1) {
          // Wait for 1 minute before starting the next iteration, but not after the last one
          await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
        }
      }
    },
    [providerUrls, loopAmount, sendSelfTransactions, initialProvider]
  );

  return {
    results,
    startSelfTransactions,
  };
};
