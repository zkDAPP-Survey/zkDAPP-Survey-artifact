// Pinata is used when EXPO_PUBLIC_PINATA_JWT is set, otherwise Lighthouse.
export const PINATA_JWT =
  process.env.EXPO_PUBLIC_PINATA_JWT?.trim() || "";

export const IPFS_API_KEY =
  process.env.EXPO_PUBLIC_LIGHTHOUSE_API_KEY?.trim() || "";

export const IPFS_GATEWAY_URL =
  process.env.EXPO_PUBLIC_IPFS_GATEWAY_URL?.trim() ||
  (PINATA_JWT
    ? "https://gateway.pinata.cloud/ipfs"
    : "https://worried-chimpanzee-kojl1.lighthouseweb3.xyz/ipfs");
