import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { Account } from "../components";
import Speedtest from "../components/Speedtest";

function Page() {
  const { isConnected } = useAccount();
  return (
    <>
      <h1>wagmi + RainbowKit + Next.js</h1>

      <ConnectButton />
      {isConnected && <Account />}
      <br />
      <Speedtest />
    </>
  );
}

export default Page;
