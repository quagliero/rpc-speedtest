import { parseUnits } from 'viem';
import { useFeeData as useFeeDataWagmi } from 'wagmi';

const useFeeData = () => {
  const { data } = useFeeDataWagmi({ watch: true });

  const maxPriorityFeePerGas = data?.maxPriorityFeePerGas || parseUnits('1', 9);

  const gasPrice = (data?.lastBaseFeePerGas || 0n) + maxPriorityFeePerGas || 0n;

  return {
    maxPriorityFeePerGas,
    gasPrice,
  };
};

export default useFeeData;
