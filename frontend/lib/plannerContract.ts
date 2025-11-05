import { ethers } from "ethers";
import { EncryptedTripPlannerAddresses } from "@/abi/EncryptedTripPlannerAddresses";
import { EncryptedTripPlannerABI } from "@/abi/EncryptedTripPlannerABI";

export type PlannerContractInfo = {
  abi: typeof EncryptedTripPlannerABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

export function getPlannerContractInfo(chainId: number | undefined): PlannerContractInfo {
  if (!chainId) {
    return { abi: EncryptedTripPlannerABI.abi };
  }

  const match =
    EncryptedTripPlannerAddresses[chainId.toString() as keyof typeof EncryptedTripPlannerAddresses];

  if (!match || match.address === ethers.ZeroAddress) {
    return { abi: EncryptedTripPlannerABI.abi, chainId };
  }

  return {
    abi: EncryptedTripPlannerABI.abi,
    address: match.address as `0x${string}`,
    chainId: match.chainId,
    chainName: match.chainName,
  };
}

