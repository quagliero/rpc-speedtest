import React, { useEffect, useMemo, useState } from "react";
import { BigNumber, Wallet, ethers } from "ethers";
import {
  mainnet,
  useAccount,
  useBlockNumber,
  useNetwork,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { parseUnits } from "ethers/lib/utils.js";
import { useSelfTransactions } from "../hooks/useSelfTransactions";
import { useNewWallets } from "../hooks/useNewWallets";
import { useCleanup } from "../hooks/useCleanup";
import ResultsTable from "./ResultsTable";
import Wallets from "./Wallets";
import RPCs from "./RPCs";
import { DEFAULT_RPC_URL, RPC_URLS } from "../core/rpcs";
import Details from "./Details";

const Speedtest: React.FC = () => {
  const [complete, setComplete] = useState(false);
  const [loops, setLoops] = useState(() => 4);
  const [delay, setDelay] = useState(() => 13);
  const [feeData, setFeeData] = useState<ethers.providers.FeeData>();
  const { chain: activeChain } = useNetwork();
  const chain = activeChain || mainnet;
  const { data: blockNumber } = useBlockNumber({
    chainId: chain.id,
  });
  const [rpcUrls, setRpcUrls] = useState(() => RPC_URLS[chain.id as 1 | 80001]);

  // used for sending initial txs
  const initialProvider = useMemo(() => {
    return new ethers.providers.JsonRpcProvider(
      DEFAULT_RPC_URL[chain.id as 1 | 80001]
    );
  }, [chain.id]);

  // user's account
  const user = useAccount();
  // throwaway speedtest wallet
  const initialWallet = useMemo(() => {
    const randomWallet = Wallet.createRandom();
    return new Wallet(randomWallet.privateKey, initialProvider);
  }, [initialProvider]);

  const userWallet = user?.address;

  useEffect(() => {
    (async () => {
      if (initialWallet && blockNumber) {
        const x = await initialWallet.getFeeData();
        setFeeData(x);
      }
    })();
  }, [initialWallet, blockNumber]);

  const maxPriorityFeePerGas =
    feeData?.maxPriorityFeePerGas || parseUnits("1", "gwei");

  const gasPrice =
    feeData?.lastBaseFeePerGas?.add(maxPriorityFeePerGas) || BigNumber.from(0);

  // current gas price * 21k transfer gas limit
  const transferPrice = gasPrice?.mul("21000");

  // transfer price * the amount of times it needs to send (+ a 25% buffer)
  const amount =
    transferPrice?.mul(loops).mul(125).div(100) || BigNumber.from(0);

  // the seeding wallet needs the amount for all wallets to do their txs, plus the gas to actually seed the wallets
  const totalAmount = amount
    .mul(rpcUrls.length)
    .add(transferPrice.mul(rpcUrls.length + 1));

  const { cleanup } = useCleanup({ initialProvider });
  const { createWallets } = useNewWallets({
    rpcUrls,
    amount,
    gasPrice,
    maxPriorityFeePerGas,
    initialWallet,
  });
  const { results, startSelfTransactions } = useSelfTransactions({
    initialProvider,
    initialWallet,
    rpcUrls,
    loops,
    delay,
  });

  const wallets = [
    {
      _isSigner: true,
      address: "0x317c3C1923c7D08D2274F1180293f79dBc968b33",
      provider: null,
      privateKey:
        "0x2373922f67426e5719f3a24f2bca17d3bd495a5e70332123a435d686389b8659",
    },
    {
      _isSigner: true,
      address: "0x6A77DA56A139B399b904F2FFC424533d7B93a0CA",
      provider: null,
      privateKey:
        "0x8d6134e82e672ddaded0ccebc2880cc2e3a3cf0ccfa78997a7f982e7def58951",
    },
    {
      _isSigner: true,
      address: "0x228D30e0f034df25d9b0f3fd10d86f2E1c043715",
      provider: null,
      privateKey:
        "0x32dd86264f181e658a7b88073cac9599bd7b6b90365be31e278d168ae908c13a",
    },
  ];

  // the prepared tx to send the eth to the speedtest wallet
  const { config } = usePrepareSendTransaction({
    request: {
      to: initialWallet?.address as string,
      value: totalAmount,
      maxPriorityFeePerGas,
      maxFeePerGas: gasPrice,
      gasLimit: "21000",
    },
    enabled: !!initialWallet?.address && !!gasPrice && !!amount,
  });

  // the send eth tx
  const { data, sendTransaction } = useSendTransaction(config);

  // the status of the send eth tx
  const { isLoading, isSuccess } = useWaitForTransaction({
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

  const testHasBegun = isLoading || isSuccess;

  return (
    <div className="Speedtest mt-8 flex-1 flex flex-col">
      <div className="container mx-auto max-w-7xl grid grid-cols-2 gap-12 px-6">
        <section className="mb-8">
          <RPCs chain={chain} urls={rpcUrls} setUrls={setRpcUrls} />
        </section>
        <section className="mb-8">
          <Details
            chain={chain}
            initialWallet={initialWallet}
            loops={loops}
            setLoops={setLoops}
            delay={delay}
            setDelay={setDelay}
            rpcCount={rpcUrls.length}
            totalCost={totalAmount}
            transferCost={transferPrice}
          />
        </section>
      </div>
      <div className="bg-indigo-600 text-white flex-1 flex flex-col px-6">
        <div className="container mx-auto max-w-7xl flex-1 flex">
          {testHasBegun && (
            <div className="w-full flex-col flex items-center justify-center">
              <button
                className="rounded-full bg-white px-4 py-2.5 text-2xl font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                type="button"
                onClick={() => sendTransaction?.()}
                disabled={!initialWallet || isLoading}
              >
                {"Start Speed Test"}
              </button>
              <h1 className="mt-6 text-indigo-300 max-w-prose text-center">
                {`Beginning the test will send ${chain.nativeCurrency.symbol} to the Test Wallet, create ${rpcUrls.length} new wallets, and transfer enough ${chain.nativeCurrency.symbol} to complete ${loops} transactions from each.`}
              </h1>
            </div>
          )}
          {testHasBegun && !wallets.length && (
            <p className="w-full flex items-center justify-center text-xl">
              <span className="mr-4">
                {isLoading
                  ? "Funding Test Wallet"
                  : `Creating ${rpcUrls.length} SpeedTest wallets`}
              </span>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </p>
          )}

          {!!wallets.length && (
            <section className="mb-8">
              <Wallets wallets={wallets} />
            </section>
          )}
          {results.length > 0 && (
            <div className="mb-6">
              <ResultsTable chain={chain} results={results} />
            </div>
          )}
          {complete && <div className="mb-6">{"Speedtest complete!"}</div>}
        </div>
      </div>
    </div>
  );
};

export default Speedtest;
