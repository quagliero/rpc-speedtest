import { Wallet } from "ethers";

/*
[
    {
        "_isSigner": true,
        "address": "0x317c3C1923c7D08D2274F1180293f79dBc968b33",
        "provider": null,
        "privateKey": "0x2373922f67426e5719f3a24f2bca17d3bd495a5e70332123a435d686389b8659"
    },
    {
        "_isSigner": true,
        "address": "0x6A77DA56A139B399b904F2FFC424533d7B93a0CA",
        "provider": null,
        "privateKey": "0x8d6134e82e672ddaded0ccebc2880cc2e3a3cf0ccfa78997a7f982e7def58951"
    },
    {
        "_isSigner": true,
        "address": "0x228D30e0f034df25d9b0f3fd10d86f2E1c043715",
        "provider": null,
        "privateKey": "0x32dd86264f181e658a7b88073cac9599bd7b6b90365be31e278d168ae908c13a"
    }
]
*/
const Wallets = ({ wallets }: { wallets: Wallet[] }) => {
  console.log(wallets);
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-bold text-lg">SpeedTest wallets created</h3>
        <span className="text-sm">
          {"Leftover balances will be swept back to your wallet on completion"}
        </span>
      </div>
      {wallets.map((w, i) => (
        <p key={w.address}>
          Wallet {i + 1}: {w.address}{" "}
          <span className="text-xs whitespace-nowrap">(🔐 {w.privateKey})</span>
        </p>
      ))}
    </div>
  );
};

export default Wallets;
