import { BigNumber, Wallet, ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils.js";
import { useEffect, useState } from "react";

const useFeeData = ({
  initialWallet,
  blockNumber,
}: {
  initialWallet: Wallet;
  blockNumber?: number;
}) => {
  const [feeData, setFeeData] = useState<ethers.providers.FeeData>();

  useEffect(() => {
    (async () => {
      if (initialWallet && blockNumber) {
        const x = await initialWallet.getFeeData();
        setFeeData(x);
      }
    })();
  }, [initialWallet, blockNumber]);

  const maxPriorityFeePerGas =
    feeData?.maxPriorityFeePerGas || parseUnits("1", "gwei");

  const gasPrice =
    feeData?.lastBaseFeePerGas?.add(maxPriorityFeePerGas) || BigNumber.from(0);

  return {
    maxPriorityFeePerGas,
    gasPrice,
  };
};

export default useFeeData;
