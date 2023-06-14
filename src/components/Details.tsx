import { BigNumber, Wallet } from "ethers";
import { formatEther } from "ethers/lib/utils.js";
import { Dispatch, SetStateAction, useState } from "react";
import { Chain } from "wagmi";

const Details = ({
  rpcCount,
  loops,
  setLoops,
  delay,
  setDelay,
  totalCost,
  transferCost,
  chain,
  initialWallet,
  wallets,
}: {
  chain: Chain;
  rpcCount: number;
  loops: number;
  setLoops: Dispatch<SetStateAction<number>>;
  delay: number;
  setDelay: Dispatch<SetStateAction<number>>;
  totalCost: BigNumber;
  transferCost: BigNumber;
  initialWallet: Wallet;
  wallets?: Wallet[];
}) => {
  const [showWallets, setShowWallets] = useState(true);

  return (
    <aside>
      <legend className="text-base font-semibold leading-6 text-gray-900">
        {"Test Details"}
      </legend>
      <dl className="mt-4 divide-y divide-gray-200 border-b border-t border-gray-200">
        <div className={`flex items-center p-2`}>
          <dt className="min-w-0 flex-1 text-sm leading-6 font-medium text-gray-900">
            {"Loops"}
            <p className="text-gray-500 text-xs">
              {"Number of transactions sent to each RPC."}
            </p>
          </dt>
          <dd className="ml-3 h-6 flex items-center">
            <span className="text-indigo-900">{loops}</span>
            <span className="ml-2 flex flex-col space-y-1">
              <button
                className="bg-indigo-50 border border-indigo-600 text-sm rounded-full text-indigo-600 flex items-center justify-center h-5 w-5"
                onClick={() => setLoops((x) => x + 1)}
              >
                {"+"}
              </button>
              <button
                className="bg-indigo-50 border border-indigo-600 text-sm rounded-full text-indigo-600 flex items-center justify-center h-5 w-5"
                onClick={() => setLoops((x) => Math.max(0, x - 1))}
              >
                {"-"}
              </button>
            </span>
          </dd>
        </div>
        <div className={`flex items-center p-2`}>
          <dt className="min-w-0 flex-1 text-sm leading-6 font-medium text-gray-900">
            {"Delay"}
            <p className="text-gray-500 text-xs">
              {"How many seconds to wait between each loop."}
            </p>
          </dt>
          <dd className="ml-3 h-6 flex items-center">
            <span className="text-indigo-900">
              {delay}
              <span className="text-xs opacity-75">{"s"}</span>
            </span>
            <span className="ml-2 flex flex-col space-y-1">
              <button
                className="bg-indigo-50 border border-indigo-600 text-sm rounded-full text-indigo-600 flex items-center justify-center h-5 w-5"
                onClick={() => setDelay((x) => x + 1)}
              >
                {"+"}
              </button>
              <button
                className="bg-indigo-50 border border-indigo-600 text-sm rounded-full text-indigo-600 flex items-center justify-center h-5 w-5"
                onClick={() => setDelay((x) => Math.max(0, x - 1))}
              >
                {"-"}
              </button>
            </span>
          </dd>
        </div>
        <div className={`flex items-center p-2 text-gray-800`}>
          <dt className="min-w-0 flex-1 text-sm leading-6 font-medium">
            {"Transactions"}
            <p className="text-gray-500 text-xs">
              {"Counting all RPC loops and test wallets created."}
            </p>
          </dt>
          <dd className="ml-3 h-6">{rpcCount * loops + rpcCount + 1}</dd>
        </div>
        <div className={`flex items-center p-2 text-gray-800`}>
          <dt className="min-w-0 flex-1 text-sm leading-6 font-medium">
            {"Cost"}
            <p className="text-gray-500 text-xs">
              {"Includes 25% buffer. Any surplus is returned to your wallet."}
            </p>
          </dt>
          <dd className="ml-3 min-h-[1.25rem] text-right leading-none">
            {formatEther(totalCost || "0")} {chain.nativeCurrency.symbol}
            <br />
            <span className="text-xs opacity-75">
              {"("}
              {formatEther(transferCost)} {chain?.nativeCurrency.symbol}
              {" per tx)"}
            </span>
          </dd>
        </div>
        <div className={`p-2 text-gray-800`}>
          <dt className="min-w-0 flex-1 text-sm leading-6 font-medium flex justify-between">
            {"Wallets"}
            <button
              onClick={() => setShowWallets((x) => !x)}
              className="text-indigo-500 underline text-xs"
            >
              {`${showWallets ? "Hide" : "Show"} Wallets`}
            </button>
          </dt>
          {showWallets && (
            <dd className="text-xs">
              <dl className="space-y-2">
                <div className="flex items-start">
                  <dt className="min-w-0 text-xs leading-6 font-medium text-gray-500 whitespace-nowrap">
                    {"Genesis"}
                  </dt>
                  <dd className="flex-1 ml-3 text-right min-w-0 leading-none">
                    <span className="break-words text-xs">
                      {initialWallet.address}
                    </span>
                    <br />
                    <span className="text-xs text-right py-1 opacity-75 break-words">
                      {initialWallet.privateKey} 🔐
                    </span>
                  </dd>
                </div>
                {wallets?.map((w, i) => (
                  <div className="flex items-start" key={w.address}>
                    <dt className="min-w-0 text-xs leading-6 font-medium text-gray-500 whitespace-nowrap">
                      {`SpeedTest ${i + 1}`}
                    </dt>
                    <dd className="flex-1 ml-3 text-right min-w-0 leading-none">
                      <span className="break-words text-xs">{w.address}</span>
                      <br />
                      <span className="text-xs text-right py-1 opacity-75 break-words">
                        {w.privateKey} 🔐
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </dd>
          )}
        </div>
      </dl>
    </aside>
  );
};

export default Details;
