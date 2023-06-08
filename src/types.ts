export type Result = {
  iteration: number;
  wallet: string;
  blockNumber: number;
  order: number;
  tx: string;
  label: string;
  firstSeen: { name: string; date: Date }[];
};
