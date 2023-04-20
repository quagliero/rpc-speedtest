import React, { useEffect, useMemo, useState } from "react";
import { BigNumber, Wallet, ethers } from "ethers";
import {
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { formatEther, parseEther } from "ethers/lib/utils.js";

const rpcURL = "https://eth.llamarpc.com";
const aggregatorURL = process.env.NEXT_PUBLIC_AGGREGATOR_URL;

const rpcProvider = new ethers.providers.JsonRpcProvider(rpcURL);
const aggregatorProvider = new ethers.providers.JsonRpcProvider(aggregatorURL);

const sendAmount = parseEther("0.0083");

const LOOP_AMOUNT = 2;

const createNewWallet = async (wallet: ethers.Wallet, amount: BigNumber) => {
  const randomWallet = ethers.Wallet.createRandom();

  // Estimate gas required for the transaction
  const gasLimit = await wallet.estimateGas({
    to: randomWallet.address,
    value: amount,
  });

  // Get the current gas price
  const baseGasPrice = await wallet.getGasPrice();
  const gasPrice = baseGasPrice.mul(110).div(100); // add 10%

  // Calculate the gas fee
  const gasFee = gasLimit.mul(gasPrice);

  const tx = {
    to: randomWallet.address,
    value: amount.sub(gasFee), // Subtract gas fee from the amount
    gasPrice,
    gasLimit,
  };

  const txResponse = await wallet.sendTransaction(tx);
  console.log(
    `Sending ${formatEther(amount.sub(gasFee))} to ${
      randomWallet.address
    } in tx ${txResponse.hash}`
  );
  await txResponse.wait();
  console.log(`Sent`);
  return randomWallet;
};

const sendSelfTransactions = async (
  wallet: ethers.Wallet,
  type: "rpc" | "aggregator",
  onResult: (result: string) => void,
  i: number
) => {
  const tx = {
    to: wallet.address,
    from: wallet.address,
    value: 0,
  };

  const txRequest = await wallet.connect(rpcProvider).populateTransaction(tx);
  const signedTx = await wallet.signTransaction(txRequest);
  // use RPC or Aggregator depending on type
  const provider = type === "rpc" ? rpcProvider : aggregatorProvider;
  const txHash = await provider.send("eth_sendRawTransaction", [signedTx]);
  console.log(
    `Transaction ${i + 1} from ${wallet.address}: ${txHash} (${type})`
  );

  const txReceipt = await rpcProvider.waitForTransaction(txHash);
  const block = await rpcProvider.getBlockWithTransactions(
    txReceipt.blockNumber
  );

  const index = block.transactions.findIndex((x) => x.hash === txHash);
  const result = `Transaction ${i + 1} from ${
    wallet.address
  } was included in block ${txReceipt.blockNumber} with order ${
    index + 1
  } (${type})`;
  console.log(result);
  onResult(result);

  return result;
};

const Speedtest: React.FC = () => {
  // speedtest wallet
  const initialWallet = useMemo(
    () =>
      new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY as string,
        rpcProvider
      ),
    []
  );

  // temp wallets that will be used to send the speedtest txs
  const [newWallet1, setNewWallet1] = useState<ethers.Wallet | null>(null);
  const [newWallet2, setNewWallet2] = useState<ethers.Wallet | null>(null);
  const [results, setResults] = useState<string[]>([]);

  // the prepared tx to send the eth to the speedtest wallet
  const { config } = usePrepareSendTransaction({
    request: {
      to: initialWallet?.address as string,
      value: sendAmount,
    },
    enabled: !!initialWallet?.address,
  });

  // the send eth tx
  const { data, sendTransaction } = useSendTransaction(config);

  // the status of the send eth tx
  const { isSuccess, isLoading } = useWaitForTransaction({
    hash: data?.hash,
  });

  useEffect(() => {
    // when the ETH has been sent to the speedtest wallet
    if (isSuccess) {
      (async () => {
        console.log(
          "Received",
          ethers.utils.formatEther(sendAmount),
          "ETH in the speedtest wallet."
        );

        console.log("Creating new wallet 1");
        const newWallet1 = await createNewWallet(
          initialWallet,
          sendAmount.div(2)
        );
        setNewWallet1(newWallet1);
        console.log(
          "New wallet created:",
          newWallet1.address,
          newWallet1.privateKey
        );

        console.log("Creating new wallet 2");
        const newWallet2 = await createNewWallet(
          initialWallet,
          sendAmount.div(2)
        );
        setNewWallet2(newWallet2);
        console.log(
          "New wallet 2 created:",
          newWallet2.address,
          newWallet2.privateKey
        );

        console.log("Sending self transactions...");
        const onResult = (result: string) => {
          setResults((prevResults) => [...prevResults, result]);
        };

        for (let i = 0; i < LOOP_AMOUNT; i++) {
          const isEven = i % 2 === 0 || i === 0;
          // alternate the order the promises are dispatched
          // so both get sent 'first' half of the time
          await Promise.all([
            sendSelfTransactions(
              newWallet1.connect(rpcProvider),
              isEven ? "rpc" : "aggregator",
              onResult,
              i
            ),
            sendSelfTransactions(
              newWallet2.connect(rpcProvider),
              isEven ? "aggregator" : "rpc",
              onResult,
              i
            ),
          ]);

          if (i < LOOP_AMOUNT - 1) {
            // Wait for 1 minute before starting the next iteration, but not after the last one
            await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
          }
        }
      })();
    }
  }, [isSuccess, initialWallet]);

  const handleStartTest = async () => {
    setResults([]);

    if (!initialWallet) {
      return;
    }

    sendTransaction?.();
  };

  return (
    <div className="Speedtest">
      <h1>Ethereum Speed Test</h1>
      {initialWallet && (
        <p>
          Speedtest wallet: {initialWallet.address} <br />
          Starting the test sends {formatEther(sendAmount)} ETH to this address
          to begin.
        </p>
      )}
      <button onClick={handleStartTest} disabled={!initialWallet}>
        Start Speed Test
      </button>
      {isLoading && <p>{"Sending ETH"}</p>}
      {(newWallet1 || newWallet2) && (
        <div>
          <p>New wallets created:</p>
          {newWallet1 && <p>Wallet 1: {newWallet1.address}</p>}
          {newWallet2 && <p>Wallet 2: {newWallet2.address}</p>}
        </div>
      )}
      {results.length > 0 && (
        <div>
          <h2>Speed Test Results</h2>
          <ul>
            {results.map((result, index) => (
              <li key={index}>{result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Speedtest;
