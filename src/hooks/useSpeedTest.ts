import { useCleanup } from './useCleanup';
import { useNewWallets } from './useNewWallets';
import { useSelfTransactions } from './useSelfTransactions';
import {
  Chain,
  useAccount,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from 'wagmi';
import { useEffect, useMemo, useState } from 'react';
import useFeeData from './useFeeData';
import { DEFAULT_RPC_URL } from '../core/rpcs';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createPublicClient, createWalletClient, custom, http } from 'viem';

const useSpeedTest = ({
  rpcUrls,
  loops,
  delay,
  chain,
}: {
  rpcUrls: string[];
  loops: number;
  delay: number;
  chain: Chain;
}) => {
  const [status, setStatus] = useState<
    | 'idle'
    | 'error'
    | 'starting'
    | 'seeding'
    | 'running'
    | 'cleaning'
    | 'success'
  >('idle');
  // user's account
  const user = useAccount();

  // used for sending initial txs
  const initialProvider = useMemo(() => {
    return createPublicClient({
      chain,
      transport: http(DEFAULT_RPC_URL[chain.id as 1 | 80001]),
    });
  }, [chain]);

  // throwaway speedtest wallet
  const initialWallet = useMemo(() => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      name: 'Initial Wallet',
      account,
      chain,
      transport: custom(initialProvider),
    });
    return {
      ...walletClient,
      privateKey,
    };
  }, [initialProvider, chain]);

  const { cleanup } = useCleanup({ initialProvider, chain });

  const { maxPriorityFeePerGas, gasPrice } = useFeeData();

  // return address
  const userWallet = user?.address;

  // current gas price * 21k transfer gas limit
  const transferPrice = gasPrice * 21000n;

  // transfer price * the amount of times it needs to send (+ a 25% buffer)
  const amount =
    (transferPrice * BigInt(loops) * BigInt(125)) / BigInt(100) || 0n;

  // the seeding wallet needs the amount for all wallets to do their txs, plus the gas to actually seed the wallets
  const totalAmount =
    amount * BigInt(rpcUrls.length) +
    transferPrice * BigInt(rpcUrls.length + 1);

  const { wallets, createWallets, setWallets } = useNewWallets({
    rpcUrls,
    chain,
    amount,
    gasPrice,
    maxPriorityFeePerGas,
    initialWallet,
  });

  const { results, startSelfTransactions, setResults } = useSelfTransactions({
    chain,
    initialProvider,
    initialWallet,
    rpcUrls: rpcUrls.filter(Boolean),
    loops,
    delay,
  });

  // the prepared tx to send the eth to the speedtest wallet
  const { config } = usePrepareSendTransaction({
    to: initialWallet?.account.address,
    value: totalAmount,
    maxPriorityFeePerGas,
    maxFeePerGas: gasPrice,
    enabled: !!initialWallet?.account.address && !!gasPrice && !!amount,
  });

  // the send eth tx
  const { data, sendTransaction } = useSendTransaction(config);

  // the status of the send eth tx
  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: async () => {
      setStatus('seeding');
      const newWallets = await createWallets();
      setStatus('running');
      await startSelfTransactions(newWallets);
      if (userWallet) {
        setStatus('cleaning');
        await cleanup({ wallets: newWallets, returnWallet: userWallet });
      }
      setStatus('success');
    },
  });

  // clear the speedtest
  const reset = () => {
    setWallets([]);
    setResults([]);
    setStatus('idle');
  };

  // we start the test when the first tx is firing.
  useEffect(() => {
    if (isLoading) {
      setStatus('starting');
    }
  }, [isLoading]);

  return {
    initialWallet,
    status,
    setStatus,
    setResults,
    setWallets,
    wallets,
    results,
    sendTransaction,
    totalAmount,
    transferPrice,
    reset,
  };
};

export default useSpeedTest;
