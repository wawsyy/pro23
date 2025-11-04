import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { ethers, fhevm } from "hardhat";
import { EncryptedTripPlanner, EncryptedTripPlanner__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedTripPlanner")) as EncryptedTripPlanner__factory;
  const planner = (await factory.deploy()) as EncryptedTripPlanner;

  return { planner, plannerAddress: await planner.getAddress() };
}

async function encryptUint32(contractAddress: string, signer: HardhatEthersSigner, value: number) {
  return fhevm.createEncryptedInput(contractAddress, signer.address).add32(value).encrypt();
}

describe("EncryptedTripPlanner (local mock)", function () {
  let signers: Signers;
  let planner: EncryptedTripPlanner;
  let plannerAddress: string;

  before(async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    signers = { deployer, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ planner, plannerAddress } = await deployFixture());
  });

  it("stores encrypted trips and updates encrypted stats", async function () {
    const duration = 5;
    const encryptedDuration = await encryptUint32(plannerAddress, signers.alice, duration);
    const encryptedUnit = await encryptUint32(plannerAddress, signers.alice, 1);

    await planner
      .connect(signers.alice)
      .storeTrip(
        ethers.toUtf8Bytes("cipher-route::alps"),
        ethers.toUtf8Bytes("cipher-schedule::morning hike"),
        "Swiss Escape",
        1,
        encryptedDuration.handles[0],
        encryptedDuration.inputProof,
        encryptedUnit.handles[0],
        encryptedUnit.inputProof,
      );

    const [tripCountHandle, nightsHandle] = await planner.getStyleStats(1);
    const trips = await fhevm.userDecryptEuint(FhevmType.euint32, tripCountHandle, plannerAddress, signers.alice);
    const nights = await fhevm.userDecryptEuint(FhevmType.euint32, nightsHandle, plannerAddress, signers.alice);

    expect(trips).to.eq(1);
    expect(nights).to.eq(duration);

    const storedTrip = await planner.connect(signers.alice).getMyTrip(0);
    expect(storedTrip.title).to.eq("Swiss Escape");
    expect(storedTrip.style).to.eq(1);
    expect(storedTrip.routeCiphertext).to.not.eq("0x");
  });

  it("overwrites existing trip payload without touching stats", async function () {
    const encryptedDuration = await encryptUint32(plannerAddress, signers.alice, 3);
    const encryptedUnit = await encryptUint32(plannerAddress, signers.alice, 1);

    await planner
      .connect(signers.alice)
      .storeTrip(
        ethers.toUtf8Bytes("cipher-route::trail"),
        ethers.toUtf8Bytes("cipher-schedule::sunset"),
        "Trailhead",
        2,
        encryptedDuration.handles[0],
        encryptedDuration.inputProof,
        encryptedUnit.handles[0],
        encryptedUnit.inputProof,
      );

    const [tripCountBefore] = await planner.getStyleStats(2);
    const clearCountBefore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      tripCountBefore,
      plannerAddress,
      signers.alice,
    );

    await planner
      .connect(signers.alice)
      .overwriteTrip(
        0,
        ethers.toUtf8Bytes("cipher-route::updated"),
        ethers.toUtf8Bytes("cipher-schedule::updated"),
        "Trailhead Updated",
        2,
      );

    const [tripCountAfter] = await planner.getStyleStats(2);
    const clearCountAfter = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      tripCountAfter,
      plannerAddress,
      signers.alice,
    );

    expect(clearCountAfter).to.eq(clearCountBefore);

    const updatedTrip = await planner.connect(signers.alice).getMyTrip(0);
    expect(updatedTrip.title).to.eq("Trailhead Updated");
    expect(updatedTrip.routeCiphertext).to.not.eq("0x");
  });

  it("lets collaborators subscribe to shared stats", async function () {
    const encryptedDuration = await encryptUint32(plannerAddress, signers.alice, 4);
    const encryptedUnit = await encryptUint32(plannerAddress, signers.alice, 1);

    await planner
      .connect(signers.alice)
      .storeTrip(
        ethers.toUtf8Bytes("cipher-route::beach"),
        ethers.toUtf8Bytes("cipher-schedule::sunrise"),
        "Ocean Hideout",
        0,
        encryptedDuration.handles[0],
        encryptedDuration.inputProof,
        encryptedUnit.handles[0],
        encryptedUnit.inputProof,
      );

    await planner.connect(signers.bob).subscribeToStyleStats(0);

    const [tripCountHandle, nightsHandle] = await planner.getStyleStats(0);
    const trips = await fhevm.userDecryptEuint(FhevmType.euint32, tripCountHandle, plannerAddress, signers.bob);
    const nights = await fhevm.userDecryptEuint(FhevmType.euint32, nightsHandle, plannerAddress, signers.bob);

    expect(trips).to.eq(1);
    expect(nights).to.eq(4);
  });
});
