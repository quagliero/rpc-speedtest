import { PrivateKeyAccount, WalletClient } from 'viem';

export type Result = {
  iteration: number;
  wallet: string;
  blockNumber: number;
  order: number;
  tx: string;
  label: string;
  firstSeen: { name: string; date: Date }[];
};

export interface WalletClientWithKey extends WalletClient {
  privateKey: `0x${string}`;
}

export interface PrivateKeyAccountWithKey extends PrivateKeyAccount {
  privateKey: `0x${string}`;
}
