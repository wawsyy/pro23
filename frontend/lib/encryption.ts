const encoder = new TextEncoder();
const decoder = new TextDecoder();
const STORAGE_KEY = "encrypted-trip-planner-key";

function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToBuffer(value: string) {
  const binary = atob(value);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

async function getCryptoKey() {
  if (typeof window === "undefined") {
    throw new Error("Client-side encryption is not available during SSR.");
  }

  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const keyBuffer = base64ToBuffer(cached);
    return window.crypto.subtle.importKey("raw", keyBuffer, "AES-GCM", true, ["encrypt", "decrypt"]);
  }

  const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);

  const exported = await window.crypto.subtle.exportKey("raw", key);
  window.localStorage.setItem(STORAGE_KEY, bufferToBase64(exported));
  return key;
}

export async function encryptPayload(payload: unknown) {
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(payload));

  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const bundle = {
    v: 1,
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(encrypted),
  };

  return encoder.encode(JSON.stringify(bundle));
}

export async function decryptPayload(bytes: string | Uint8Array) {
  const key = await getCryptoKey();
  const asString = typeof bytes === "string" ? bytes : new TextDecoder().decode(bytes);
  const parsed = JSON.parse(asString) as { iv: string; data: string };
  const iv = new Uint8Array(base64ToBuffer(parsed.iv));
  const cipherBuffer = base64ToBuffer(parsed.data);

  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBuffer);
  return JSON.parse(decoder.decode(decrypted));
}

export function calculateNights(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff < 1 ? 1 : diff;
}

