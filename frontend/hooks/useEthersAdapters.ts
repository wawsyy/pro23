import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAccount, usePublicClient } from "wagmi";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

export function useBrowserProvider() {
  const { chainId } = useAccount();

  return useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return undefined;
    }
    return new ethers.BrowserProvider(window.ethereum, chainId);
  }, [chainId]);
}

export function useEthersSigner() {
  const browserProvider = useBrowserProvider();
  const { address } = useAccount();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner>();

  useEffect(() => {
    let ignore = false;
    async function loadSigner() {
      if (!browserProvider || !address) {
        setSigner(undefined);
        return;
      }
      try {
        const nextSigner = await browserProvider.getSigner();
        if (!ignore) {
          setSigner(nextSigner);
        }
      } catch {
        if (!ignore) {
          setSigner(undefined);
        }
      }
    }
    loadSigner();
    return () => {
      ignore = true;
    };
  }, [browserProvider, address]);

  return signer;
}

export function useReadonlyEthersProvider() {
  const publicClient = usePublicClient();

  return useMemo(() => {
    if (!publicClient) {
      return undefined;
    }

    const { chain, transport } = publicClient;
    const transportUrl =
      (transport as unknown as { url?: string }).url ??
      (transport as unknown as { value?: { url?: string } }).value?.url;

    if (!transportUrl) {
      return undefined;
    }

    return new ethers.JsonRpcProvider(transportUrl, chain?.id);
  }, [publicClient]);
}

