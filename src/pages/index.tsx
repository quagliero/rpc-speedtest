import { ConnectButton } from "@rainbow-me/rainbowkit";
import Speedtest from "../components/Speedtest";

function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto max-w-7xl px-6">
        <nav
          className="flex items-center justify-between py-6"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center">
              <span className="text-2xl mr-2">{"🚀"}</span>
              <span className="font-bold text-xl text-indigo-600">
                RPC SpeedTest
              </span>
            </a>
          </div>

          <div className="flex lg:flex-1 lg:justify-end">
            <ConnectButton />
          </div>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">
        <Speedtest />
      </main>
    </div>
  );
}

export default Page;
