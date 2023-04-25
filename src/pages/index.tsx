import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { Account } from "../components";
import Speedtest from "../components/Speedtest";

function Page() {
  const { isConnected } = useAccount();
  return (
    <div className="container mx-auto py-4">
      <header className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold">RPC Speedtest</h1>

        <ConnectButton />
      </header>
      <main>
        <Speedtest />
      </main>
    </div>
  );
}

export default Page;
