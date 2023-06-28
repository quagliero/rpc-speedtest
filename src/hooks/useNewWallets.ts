// src/hooks/useNewWallets.ts
import { waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import type { Account, Chain, WalletClient } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { PrivateKeyAccountWithKey } from '../types';

const createNewWallet = async ({
  wallet,
  amount,
  gasPrice,
  maxPriorityFeePerGas,
  i,
  chain,
}: {
  wallet: WalletClient;
  chain: Chain;
  amount: bigint;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  i: number;
}): Promise<PrivateKeyAccountWithKey> => {
  const privateKey = generatePrivateKey();
  const randomWallet = privateKeyToAccount(privateKey);

  const tx = {
    account: wallet.account as Account,
    to: randomWallet.address,
    value: amount,
    gas: 21000n,
    chain,
    maxPriorityFeePerGas,
    maxFeePerGas: gasPrice,
  };

  const hash = await wallet.sendTransaction(tx);

  console.log(
    `Seeding wallet ${i + 1}:`,
    randomWallet.address,
    `in tx ${hash}`
  );
  await waitForTransaction({ hash, chainId: chain.id, timeout: 1000 }).catch(
    (e) => console.log(e)
  );

  return {
    ...randomWallet,
    privateKey,
  };
};

export const useNewWallets = ({
  rpcUrls,
  amount,
  gasPrice,
  maxPriorityFeePerGas,
  initialWallet,
  chain,
}: {
  chain: Chain;
  rpcUrls: string[];
  amount: bigint;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  initialWallet: WalletClient;
}) => {
  const [wallets, setWallets] = useState<PrivateKeyAccountWithKey[]>([]);

  const createWallets = useCallback(async () => {
    console.log(`Creating ${rpcUrls.length} wallets`);
    const newWallets: PrivateKeyAccountWithKey[] = [];

    for (let i = 0; i < rpcUrls.length; i++) {
      const wallet = await createNewWallet({
        wallet: initialWallet,
        amount,
        gasPrice,
        maxPriorityFeePerGas,
        chain,
        i,
      });
      console.log(`Funded wallet ${i + 1}:`, wallet.address, wallet.privateKey);

      setWallets((prevWallets) => [...prevWallets, wallet]);
      newWallets.push(wallet);
    }

    console.log('Wallet creation completed');

    return newWallets;
  }, [amount, gasPrice, maxPriorityFeePerGas, initialWallet, rpcUrls, chain]);

  return {
    wallets,
    setWallets,
    createWallets,
  };
};
