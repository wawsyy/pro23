"use client";

import { useAccount } from "wagmi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import { PlannerHero } from "@/components/PlannerHero";
import { WorkflowSteps } from "@/components/WorkflowSteps";
import { TripBuilder, TripFormValues } from "@/components/TripBuilder";
import { TripVault, TripSummary, DecryptedTrip } from "@/components/TripVault";
import { useFhevm } from "@/fhevm/useFhevm";
import { useEthersSigner, useReadonlyEthersProvider } from "@/hooks/useEthersAdapters";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { getPlannerContractInfo } from "@/lib/plannerContract";
import { encryptPayload, decryptPayload, calculateNights } from "@/lib/encryption";
import { encryptUint32Value } from "@/lib/fheOperations";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

const MOCK_CHAINS = { 31337: "http://localhost:8545" } as const;

export default function Home() {
  const { address, chainId } = useAccount();
  const signer = useEthersSigner();
  const readonlyProvider = useReadonlyEthersProvider();
  const { storage } = useInMemoryStorage();

  const eip1193Provider =
    typeof window !== "undefined" ? (window.ethereum as ethers.Eip1193Provider | undefined) : undefined;

  const { instance: fheInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: eip1193Provider,
    chainId,
    initialMockChains: MOCK_CHAINS,
    enabled: Boolean(eip1193Provider),
  });

  const plannerInfo = getPlannerContractInfo(chainId);

  const baseRunner = readonlyProvider ?? signer;
  const baseContract = useMemo(() => {
    if (!plannerInfo.address || !baseRunner) {
      return undefined;
    }
    return new ethers.Contract(plannerInfo.address, plannerInfo.abi, baseRunner);
  }, [plannerInfo, baseRunner]);

  const writeContract = useMemo(() => {
    if (!plannerInfo.address || !signer) {
      return undefined;
    }
    return new ethers.Contract(plannerInfo.address, plannerInfo.abi, signer);
  }, [plannerInfo, signer]);

  const [tripSummaries, setTripSummaries] = useState<TripSummary[]>([]);
  const [decryptedTrip, setDecryptedTrip] = useState<DecryptedTrip | null>(null);
  const [pendingTrip, setPendingTrip] = useState(false);
  const [pendingTripDecrypt, setPendingTripDecrypt] = useState(false);
  const [feedback, setFeedback] = useState<string>("");


  const refreshTrips = useCallback(async () => {
    if (!writeContract || !address) {
      setTripSummaries([]);
      return;
    }
    try {
      const onchain = await writeContract.listMyTrips();
      const formatted: TripSummary[] = onchain.map((trip: { title: string; style: bigint | number; createdAt: bigint | number }, idx: number) => ({
        id: idx,
        title: trip.title,
        style: Number(trip.style),
        createdAt: new Date(Number(trip.createdAt) * 1000).toLocaleString(),
      }));
      setTripSummaries(formatted.reverse());
    } catch (error) {
      console.warn("Unable to load user trips", error);
    }
  }, [writeContract, address]);

  useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  const handleSubmitTrip = useCallback(
    async (values: TripFormValues) => {
      if (!address) {
        setFeedback("Please connect your wallet first.");
        return;
      }
      if (!chainId) {
        setFeedback("Unable to detect network. Please switch to Sepolia or Hardhat network.");
        return;
      }
      if (!plannerInfo.address) {
        setFeedback(`Contract not deployed on current network (Chain ID: ${chainId}). Please switch to Sepolia (11155111) or Hardhat (31337).`);
        return;
      }
      if (!signer) {
        setFeedback("Unable to get wallet signer. Please reconnect your wallet.");
        return;
      }
      if (fhevmStatus === "loading" || fhevmStatus === "idle") {
        setFeedback("FHEVM is still initializing. Please wait a moment and try again.");
        return;
      }
      if (fhevmStatus === "error") {
        const errorMsg = fhevmError?.message || "Unknown error";
        const isRelayerError = errorMsg.includes("Relayer temporarily unavailable") || 
                              errorMsg.includes("relayer") || 
                              errorMsg.includes("timeout");
        if (isRelayerError) {
          setFeedback("⚠️ FHE Relayer service is temporarily unavailable. Please try again in a few minutes or use Hardhat local network.");
        } else {
          setFeedback(`FHEVM initialization failed: ${errorMsg}. Please refresh the page.`);
        }
        return;
      }
      if (!fheInstance) {
        setFeedback("FHEVM instance is not available. Please wait a moment and try again.");
        return;
      }
      if (!writeContract) {
        setFeedback("Contract instance not ready. Please try again.");
        return;
      }

      // Check if on Sepolia and warn about potential relayer issues
      const isSepolia = chainId === 11155111;
      if (isSepolia) {
        setFeedback("Note: Using Sepolia testnet. FHE encryption may take longer...");
      }

      setPendingTrip(true);
      setFeedback("Encrypting itinerary...");

      try {
        const signerAddress = await signer.getAddress();
        const nights = Math.max(1, calculateNights(values.startDate, values.endDate));
        
        setFeedback("Encrypting route and schedule...");
        const routeCipher = await encryptPayload({
          title: values.title,
          destinations: values.destinations,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        const scheduleCipher = await encryptPayload({
          plan: values.plan,
          capturedAt: new Date().toISOString(),
        });

        setFeedback("Encrypting statistics with FHE...");
        const nightsEnc = await encryptUint32Value(
          fheInstance,
          plannerInfo.address,
          signerAddress,
          nights,
        );
        const unitEnc = await encryptUint32Value(
          fheInstance,
          plannerInfo.address,
          signerAddress,
          1,
        );

        setFeedback("Submitting to blockchain...");
        const tx = await writeContract.storeTrip(
          ethers.hexlify(routeCipher),
          ethers.hexlify(scheduleCipher),
          values.title.trim(),
          values.style,
          nightsEnc.handles[0],
          nightsEnc.inputProof,
          unitEnc.handles[0],
          unitEnc.inputProof,
        );
        setFeedback(`Trip submitted. Waiting for confirmation (${tx.hash.slice(0, 10)}…).`);
        await tx.wait();
        setFeedback("Trip stored successfully!");
        await refreshTrips();
      } catch (error) {
        // Provide user-friendly error messages
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("Relayer temporarily unavailable")) {
          // Don't log relayer errors to console as errors - they're expected service issues
          console.info("Relayer service temporarily unavailable - user notified");
          setFeedback("⚠️ Relayer temporarily unavailable. Please try again later.");
        } else {
          // Log other errors normally
          console.error("Trip submission error:", error);
          
          if (errorMessage.includes("user rejected") || 
                   errorMessage.includes("User denied")) {
            setFeedback("Transaction was cancelled. Please try again when ready.");
          } else if (errorMessage.includes("insufficient funds") ||
                     errorMessage.includes("gas")) {
            setFeedback("⚠️ Insufficient funds for transaction. Please ensure your wallet has enough ETH.");
          } else if (errorMessage.includes("network") || 
                     errorMessage.includes("Network")) {
            setFeedback("⚠️ Network error. Please check your connection and try again.");
          } else {
            setFeedback(`⚠️ ${errorMessage || "Failed to store encrypted trip. Please try again."}`);
          }
        }
      } finally {
        setPendingTrip(false);
      }
    },
    [writeContract, signer, fheInstance, plannerInfo.address, refreshTrips, fhevmStatus, fhevmError],
  );

  const handleDecryptTrip = useCallback(
    async (tripId: number) => {
      if (!address) {
        setFeedback("Please connect your wallet first.");
        return;
      }
      if (!chainId) {
        setFeedback("Unable to detect network. Please switch to Sepolia or Hardhat network.");
        return;
      }
      if (!plannerInfo.address) {
        setFeedback(`Contract not deployed on current network (Chain ID: ${chainId}). Please switch to Sepolia (11155111) or Hardhat (31337).`);
        return;
      }
      if (!signer) {
        setFeedback("Unable to get wallet signer. Please reconnect your wallet.");
        return;
      }
      if (fhevmStatus === "loading" || fhevmStatus === "idle") {
        setFeedback("FHEVM is still initializing. Please wait a moment and try again.");
        return;
      }
      if (fhevmStatus === "error") {
        const errorMsg = fhevmError?.message || "Unknown error";
        const isRelayerError = errorMsg.includes("Relayer temporarily unavailable") || 
                              errorMsg.includes("relayer") || 
                              errorMsg.includes("timeout");
        if (isRelayerError) {
          setFeedback("⚠️ FHE Relayer service is temporarily unavailable. Please try again in a few minutes or use Hardhat local network.");
        } else {
          setFeedback(`FHEVM initialization failed: ${errorMsg}. Please refresh the page.`);
        }
        return;
      }
      if (!fheInstance) {
        setFeedback("FHEVM instance is not available. Please wait a moment and try again.");
        return;
      }
      if (!writeContract) {
        setFeedback("Contract instance not ready. Please try again.");
        return;
      }

      setPendingTripDecrypt(true);
      setDecryptedTrip(null);

      try {
        // Request wallet signature for decryption authorization
        // This will trigger the wallet popup
        setFeedback("Requesting wallet signature for decryption...");
        const decryptionSignature = await FhevmDecryptionSignature.loadOrSign(
          fheInstance,
          [plannerInfo.address],
          signer,
          storage,
        );

        if (!decryptionSignature) {
          throw new Error("Failed to obtain decryption authorization signature.");
        }

        setFeedback("Decrypting trip data...");
        const encoded = await writeContract.getMyTrip(tripId);
        const routeData = await decryptPayload(ethers.getBytes(encoded.routeCiphertext));
        const scheduleData = await decryptPayload(ethers.getBytes(encoded.scheduleCiphertext));
        setDecryptedTrip({
          id: tripId,
          title: encoded.title,
          style: Number(encoded.style),
          route:
            typeof routeData === "string"
              ? routeData
              : JSON.stringify(routeData, null, 2).replace(/["{}]/g, ""),
          schedule:
            typeof scheduleData === "string"
              ? scheduleData
              : JSON.stringify(scheduleData, null, 2).replace(/["{}]/g, ""),
          createdAt: new Date(Number(encoded.createdAt) * 1000).toLocaleString(),
        });
        setFeedback("Trip decrypted successfully!");
      } catch (error) {
        console.error("Trip decryption error:", error);
        
        // Provide user-friendly error messages
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("Encryption service is temporarily unavailable") ||
            errorMessage.includes("network connection")) {
          setFeedback("⚠️ Decryption service unavailable. Please check your internet connection and try again.");
        } else if (errorMessage.includes("user rejected") || 
                   errorMessage.includes("User denied")) {
          setFeedback("Decryption authorization was cancelled. Please try again when ready.");
        } else if (errorMessage.includes("Failed to obtain decryption authorization")) {
          setFeedback("⚠️ Unable to authorize decryption. Please ensure your wallet is connected and try again.");
        } else {
          setFeedback(`⚠️ ${errorMessage || "Unable to decrypt trip locally. Please try again."}`);
        }
      } finally {
        setPendingTripDecrypt(false);
      }
    },
    [writeContract, signer, fheInstance, plannerInfo.address, storage, fhevmStatus, fhevmError],
  );


  const isContractReady = Boolean(plannerInfo.address && baseContract);
  const disableActions = !isContractReady || !address;

  // Determine status message
  const getStatusMessage = () => {
    if (!address) {
      return { message: "Please connect your wallet to get started.", type: "info" };
    }
    if (!chainId) {
      return { message: "Unable to detect network. Please switch to Sepolia or Hardhat.", type: "warning" };
    }
    if (!plannerInfo.address) {
      return { 
        message: `Contract not available on current network (Chain ID: ${chainId}). Please switch to Sepolia (11155111) or Hardhat (31337).`, 
        type: "warning" 
      };
    }
    if (fhevmStatus === "loading") {
      return { message: "FHEVM is initializing. This may take a few moments...", type: "info" };
    }
    if (fhevmStatus === "error") {
      const errorMsg = fhevmError?.message || "Unknown error";
      // Check if it's a relayer-related error
      const isRelayerError = errorMsg.includes("Relayer temporarily unavailable") || 
                            errorMsg.includes("relayer") || 
                            errorMsg.includes("timeout");
      if (isRelayerError) {
        return { 
          message: `⚠️ FHE Relayer service is temporarily unavailable. This is a known issue with the Sepolia testnet relayer. Please try again in a few minutes or use Hardhat local network for testing.`, 
          type: "warning" 
        };
      }
      return { 
        message: `FHEVM initialization failed: ${errorMsg}. Please try refreshing the page.`, 
        type: "warning" 
      };
    }
    if (fhevmStatus === "idle" && !fheInstance) {
      return { message: "FHEVM is starting up. Please wait...", type: "info" };
    }
    if (!fheInstance) {
      return { message: "FHEVM is initializing. Please wait a moment...", type: "info" };
    }
    return { message: "Ready to use! You can now create and manage encrypted trips.", type: "success" };
  };

  const status = getStatusMessage();

  return (
    <div className="flex flex-col gap-8">
      <PlannerHero chainName={plannerInfo.chainName} contractAddress={plannerInfo.address} />
      {status.message && (
        <div className={`rounded-2xl border p-4 ${
          status.type === "warning" 
            ? "border-amber-200 bg-amber-50 text-amber-800" 
            : status.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-blue-200 bg-blue-50 text-blue-800"
        }`}>
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}
      <WorkflowSteps />
      <TripBuilder disabled={disableActions} pending={pendingTrip} onSubmit={handleSubmitTrip} />
      <TripVault
        trips={tripSummaries}
        decryptedTrip={decryptedTrip}
        onDecrypt={handleDecryptTrip}
        pending={pendingTripDecrypt}
        disabled={disableActions}
      />
      {feedback && (
        <section className="rounded-3xl border border-white/30 bg-white/80 p-4 text-sm text-slate-600 shadow">
          <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700">
            {feedback}
          </p>
        </section>
      )}
    </div>
  );
}
