import { PublicClient, createWalletClient, custom, formatEther } from 'viem';
import { Chain } from 'wagmi';
import { PrivateKeyAccountWithKey } from '../types';
import { privateKeyToAccount } from 'viem/accounts';
import { waitForTransaction } from '@wagmi/core';

export const useCleanup = ({
  initialProvider,
  chain,
}: {
  initialProvider: PublicClient;
  chain: Chain;
}) => {
  const cleanup = async ({
    wallets,
    returnWallet,
  }: {
    wallets: PrivateKeyAccountWithKey[];
    returnWallet: `0x${string}`;
  }) => {
    const allTransactions: `0x${string}`[] = [];
    console.log('Cleaning up wallets');
    for (let i = 0; i < wallets.length; i++) {
      console.log(`Wallet ${i + 1} of ${wallets.length}`);
      const wallet = wallets[i];
      const balance = await initialProvider.getBalance({
        address: wallet.address,
      });
      // @TODO get gas price
      // const gasPrice = await initialProvider.getGasPrice();
      // const value = balance - gasPrice * 21000n;
      // use 5% for gas?
      const value = (balance * BigInt(95)) / BigInt(100);

      if (balance > 0 && value > 0) {
        console.log(
          `Sweeping ${formatEther(balance)} ${
            chain.nativeCurrency.symbol
          } from ${wallet.address}`
        );
        const tx = {
          to: returnWallet,
          from: wallet.address,
          value,
          gas: 21000n,
          // gasPrice,
        };
        // const txRequest = await wallet
        //   .connect(initialProvider)
        //   .populateTransaction(tx);
        const account = privateKeyToAccount(wallet.privateKey);
        const walletClient = createWalletClient({
          account,
          chain,
          transport: custom(initialProvider),
        });
        // const signedTx = await wallet.signTransaction(tx);
        const txHash = await walletClient.sendTransaction(tx);
        console.log(`Swept to ${returnWallet} in tx ${txHash}`);
        allTransactions.push(txHash);
      } else {
        console.log(`Insufficient ${chain.nativeCurrency.symbol} to sweep`);
      }
    }

    // Wait for all sweep transactions to complete
    await Promise.all(
      allTransactions.map(async (txHash) => {
        await waitForTransaction({ hash: txHash });
      })
    );

    console.log('Cleanup done');

    return wallets;
  };

  return { cleanup };
};
