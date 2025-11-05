import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

/**
 * Encrypts a uint32 value using FHEVM with retry logic
 */
async function encryptWithRetry(
  input: ReturnType<FhevmInstance["createEncryptedInput"]>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Awaited<ReturnType<typeof input.encrypt>>> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await input.encrypt();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a relayer error that might be retryable
      const isRetryable = errorMessage.includes("Relayer didn't response") ||
                         errorMessage.includes("Bad JSON") ||
                         errorMessage.includes("relayer") ||
                         errorMessage.includes("Relayer") ||
                         errorMessage.includes("network") ||
                         errorMessage.includes("timeout");
      
      if (isRetryable && attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      // If not retryable or last attempt, throw
      throw error;
    }
  }
  
  throw lastError;
}

export async function encryptUint32Value(
  instance: FhevmInstance | undefined,
  contractAddress: `0x${string}`,
  signerAddress: string | undefined,
  value: number,
) {
  if (!instance || !signerAddress) {
    throw new Error("Missing FHE instance or signer");
  }

  try {
    const input = instance.createEncryptedInput(contractAddress, signerAddress);
    input.add32(value);
    return await encryptWithRetry(input);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a relayer-specific error
    const isRelayerError = errorMessage.includes("Relayer didn't response") || 
                          errorMessage.includes("Bad JSON") ||
                          (errorMessage.toLowerCase().includes("relayer") && 
                           (errorMessage.includes("response") || 
                            errorMessage.includes("unavailable") ||
                            errorMessage.includes("error")));
    
    if (isRelayerError) {
      throw new Error("Relayer temporarily unavailable");
    }
    
    // Re-throw other errors as-is
    throw error;
  }
}

export async function decryptHandles(
  instance: FhevmInstance | undefined,
  contractAddress: `0x${string}`,
  signer: ethers.Signer | undefined,
  storage: GenericStringStorage,
  handles: string[],
) {
  if (!instance || !signer || handles.length === 0) {
    return {};
  }

  const signature = await FhevmDecryptionSignature.loadOrSign(
    instance,
    [contractAddress],
    signer,
    storage,
  );
  if (!signature) {
    throw new Error("Unable to create decryption signature");
  }

  const request = handles.map((handle) => ({
    handle,
    contractAddress,
  }));

  return instance.userDecrypt(
    request,
    signature.privateKey,
    signature.publicKey,
    signature.signature,
    signature.contractAddresses,
    signature.userAddress,
    signature.startTimestamp,
    signature.durationDays,
  );
}

