import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedTripPlanner";

/**
 * Quick start (localhost)
 * =======================
 * npx hardhat node
 * npx hardhat --network localhost deploy
 * npx hardhat --network localhost planner:decrypt-style --style 0
 */

task("planner:address", "Prints the EncryptedTripPlanner address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;
    const deployment = await deployments.get(CONTRACT_NAME);
    console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
  },
);

task("planner:decrypt-style", "Decrypt encrypted analytics for a travel style")
  .addParam("style", "Style bucket index (0-3)")
  .addOptionalParam("address", "Optional contract address override")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    const style = Number(taskArguments.style);
    if (!Number.isInteger(style) || style < 0 || style > 3) {
      throw new Error("style must be an integer between 0 and 3");
    }

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get(CONTRACT_NAME);

    await fhevm.initializeCLIApi();
    const signer = (await ethers.getSigners())[0];
    const planner = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const tx = await planner.connect(signer).subscribeToStyleStats(style);
    await tx.wait();

    const stats = await planner.getStyleStats(style);

    let trips = "0";
    if (stats[0] !== ethers.ZeroHash) {
      trips = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        stats[0],
        deployment.address,
        signer,
      );
    }

    let nights = "0";
    if (stats[1] !== ethers.ZeroHash) {
      nights = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        stats[1],
        deployment.address,
        signer,
      );
    }

    console.log(`Style ${style}: trips=${trips}, nights=${nights}`);
  });
