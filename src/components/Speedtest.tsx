import React, { useEffect, useMemo, useState } from "react";
import { BigNumber, Wallet, ethers } from "ethers";
import {
  useAccount,
  useFeeData,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { formatEther } from "ethers/lib/utils.js";
import { useSelfTransactions } from "../hooks/useSelfTransactions";
import { useNewWallets } from "../hooks/useNewWallets";
import { useCleanup } from "../hooks/useCleanup";

const ticksToDate = (ticks: number) => {
  const epochTicks = BigInt("621355968000000000");
  const unixMilliseconds = BigInt((BigInt(ticks) - epochTicks) / BigInt(10000));
  const date = new Date(Number(unixMilliseconds));

  return date;
};

// Define an array of rpcUrls
const aggregatorURL = process.env.NEXT_PUBLIC_AGGREGATOR_URL;
const rpcUrls = [
  "https://eth-mainnet-public.unifra.io",
  // aggregatorURL,
];

// mumbai tests
// const aggregatorURL = "https://polygon-mumbai.blockpi.network/v1/rpc/public";
// const rpcUrls = [
//   "https://polygon-testnet.public.blastapi.io",
//   "https://rpc.ankr.com/polygon_mumbai",
//   // aggregator URL
//   aggregatorURL,
// ];

// Use the first rpcUrl as the initial provider
const initialProvider = new ethers.providers.JsonRpcProvider(rpcUrls[0]);

const LOOP_AMOUNT = 1;

const Speedtest: React.FC = () => {
  const [complete, setComplete] = useState(false);
  // user's account
  const user = useAccount();
  // speedtest wallet
  const initialWallet = useMemo(
    () =>
      new Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY as string,
        initialProvider
      ),
    []
  );
  const userWallet = user?.address;

  const { data: feeData } = useFeeData({});

  const gasPrice = feeData?.gasPrice || BigNumber.from(0);
  // current gas price * 21k transfer gas limit
  const transferPrice = gasPrice?.mul("21000");

  // transfer price * the amount of times it needs to send (+ a 25% buffer)
  const amount =
    transferPrice?.mul(LOOP_AMOUNT).mul(125).div(100) || BigNumber.from(0);

  // the seeding wallet needs the amount for all wallets to do their txs, plus the gas to actually seed the wallets
  // the +1 is the additional gas for the user transfer to the seed wallet
  const totalAmount = amount
    .mul(rpcUrls.length)
    .add(transferPrice.mul(rpcUrls.length + 1));

  const { cleanup } = useCleanup({ initialProvider });
  const { wallets, createWallets } = useNewWallets({
    rpcUrls,
    amount,
    gasPrice,
    initialWallet,
  });
  const { results, startSelfTransactions } = useSelfTransactions(
    initialProvider,
    rpcUrls,
    LOOP_AMOUNT
  );

  // the prepared tx to send the eth to the speedtest wallet
  const { config } = usePrepareSendTransaction({
    request: {
      to: initialWallet?.address as string,
      value: amount?.mul(rpcUrls.length), // send the amount * number of RPCs
    },
    enabled: !!initialWallet?.address && !!gasPrice && !!amount,
  });

  // the send eth tx
  const { data, sendTransaction } = useSendTransaction(config);

  // the status of the send eth tx
  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: async () => {
      const newWallets = await createWallets();
      await startSelfTransactions(newWallets);
      if (userWallet) {
        await cleanup({ wallets: newWallets, returnWallet: userWallet });
      }
      setComplete(true);
    },
  });

  // Manual cleanup of privkeys
  // useEffect(() => {
  //   (async () => {
  //     if (userWallet) {
  //       const privkeys = [''];

  //       const w = privkeys.map((x) => new Wallet(x, initialProvider));

  //       await cleanup({ wallets: w, returnWallet: userWallet });
  //     }
  //   })();
  // }, [userWallet]);

  return (
    <div className="Speedtest">
      <section className="mb-8">
        <h2 className="text-lg font-bold">{"RPCs"}</h2>
        <ul>
          {rpcUrls.map((rpc) => (
            <li key={rpc}>{rpc}</li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        {initialWallet && (
          <>
            <p className="mb-6 text-sm">
              Iterations: {LOOP_AMOUNT} <br />
              <span className="text-sm">
                Zero Transfer gas cost: {formatEther(transferPrice)} ETH
                <br />
                Transactions: {rpcUrls.length * LOOP_AMOUNT}
              </span>
            </p>
            <p className="mb-8">
              Starting the test sends {formatEther(totalAmount || "0")} ETH to
              begin.
            </p>
          </>
        )}
        <button
          className="bg-teal-500 text-white rounded-lg p-2"
          onClick={() => sendTransaction?.()}
          disabled={!initialWallet || isLoading}
        >
          {"Start Speed Test"}
        </button>
      </section>
      {isLoading && <p className="animate-pulse">{"Sending ETH"}</p>}
      {!!wallets.length && (
        <section className="mb-8">
          <div className="mb-4">
            <h3 className="font-bold text-lg">New wallets created</h3>
            <span className="text-sm">
              {
                "Leftover balances will be swept back to your wallet on completion"
              }
            </span>
          </div>
          {wallets.map((w, i) => (
            <p key={w.address}>
              Wallet {i + 1}: {w.address} ({w.privateKey})
            </p>
          ))}
        </section>
      )}
      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold">Results</h2>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">{"Iteration"}</th>
                <th className="p-2 text-left">{"Transaction"}</th>
                <th className="p-2 text-right">{"Block"}</th>
                <th className="p-2 text-right">{"Order"}</th>
                <th className="p-2 text-right">{"First seen"}</th>
                <th className="p-2 text-right">{"RPC"}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                return (
                  <tr key={result.tx}>
                    <td className="p-2">{result.iteration}</td>
                    <td className="p-2">
                      <span className="truncate block">{result.tx}</span>
                    </td>
                    <td className="p-2 text-right">{result.blockNumber}</td>
                    <td className="p-2 text-right">{result.order}</td>
                    <td className="p-2 text-right">
                      {result.firstSeen
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((fs, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{fs.name}</span>
                            <span>{fs.date.getTime()}</span>
                          </div>
                        ))}
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      {result.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {complete && <div className="mb-6">{"Speedtest complete!"}</div>}
    </div>
  );
};

export default Speedtest;
