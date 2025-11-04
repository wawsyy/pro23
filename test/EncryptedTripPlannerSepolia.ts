import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import { EncryptedTripPlanner } from "../types";

describe("EncryptedTripPlanner (Sepolia)", function () {
  let planner: EncryptedTripPlanner;
  let plannerAddress: string;
  let alice: HardhatEthersSigner;

  before(async function () {
    if (fhevm.isMock) {
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedTripPlanner");
      plannerAddress = deployment.address;
      planner = (await ethers.getContractAt(
        "EncryptedTripPlanner",
        deployment.address,
      )) as EncryptedTripPlanner;
    } catch (error) {
      (error as Error).message += ". Deploy the contract with 'npx hardhat deploy --network sepolia'.";
      throw error;
    }

    [alice] = await ethers.getSigners();
  });

  it("grants access and decrypts current adventure stats snapshot", async function () {
    this.timeout(4 * 60 * 1000);

    const subscribeTx = await planner.connect(alice).subscribeToStyleStats(0);
    await subscribeTx.wait();

    const [tripCountHandle, nightsHandle] = await planner.getStyleStats(0);

    let trips = "0";
    if (tripCountHandle !== ethers.ZeroHash) {
      trips = await fhevm.userDecryptEuint(FhevmType.euint32, tripCountHandle, plannerAddress, alice);
    }

    let nights = "0";
    if (nightsHandle !== ethers.ZeroHash) {
      nights = await fhevm.userDecryptEuint(FhevmType.euint32, nightsHandle, plannerAddress, alice);
    }

    console.log(`Adventure stats on Sepolia -> trips=${trips}, nights=${nights}`);
    expect(Number(trips)).to.be.gte(0);
    expect(Number(nights)).to.be.gte(0);
  });
});
