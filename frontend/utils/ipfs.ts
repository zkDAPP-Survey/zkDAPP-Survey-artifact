import { IPFS_API_KEY, IPFS_GATEWAY_URL, PINATA_JWT } from "@/config/ipfs";
import { ElectionMetadataDocument } from "@/types/election";
import { stableStringify } from "@/utils/hash";

const normalizeIpfsUri = (cidOrUri: string) =>
  cidOrUri.startsWith("ipfs://") ? cidOrUri : `ipfs://${cidOrUri}`;

const cidFromUri = (uri: string) => uri.replace(/^ipfs:\/\//i, "").replace(/^\/ipfs\//i, "");

const LIGHTHOUSE_UPLOAD_URL = "https://upload.lighthouse.storage/api/v0/add?cid-version=1";
const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";

const buildMultipartTextBody = ({
  fieldName,
  fileName,
  contentType,
  text,
  boundary,
  extraFields = {},
}: {
  fieldName: string;
  fileName: string;
  contentType: string;
  text: string;
  boundary: string;
  extraFields?: Record<string, string>;
}) =>
  [
    ...Object.entries(extraFields).flatMap(([name, value]) => [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${name}"`,
      "",
      value,
    ]),
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"`,
    `Content-Type: ${contentType}`,
    "",
    text,
    `--${boundary}--`,
    "",
  ].join("\r\n");

export const resolveIpfsGatewayUrl = (uri: string) => {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return `${IPFS_GATEWAY_URL.replace(/\/$/, "")}/${cidFromUri(uri)}`;
};

const uploadToPinata = async (fileName: string, text: string) => {
  const boundary = `----zkdapp-survey-${Date.now().toString(16)}`;
  const response = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: buildMultipartTextBody({
      fieldName: "file",
      fileName,
      contentType: "application/json",
      text,
      boundary,
      // Files must be public so the CID can be fetched through an IPFS gateway.
      extraFields: { network: "public", name: fileName },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata/IPFS metadata upload failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const cid = payload?.data?.cid;

  if (!cid || typeof cid !== "string") {
    throw new Error("Pinata upload did not return a CID.");
  }

  return normalizeIpfsUri(cid);
};

export const uploadElectionMetadataDocument = async (document: ElectionMetadataDocument) => {
  const fileName = `survey-election-metadata-${Date.now()}.json`;

  if (PINATA_JWT) {
    return uploadToPinata(fileName, stableStringify(document));
  }

  if (!IPFS_API_KEY) {
    throw new Error(
      "Missing IPFS credentials. Set EXPO_PUBLIC_PINATA_JWT or EXPO_PUBLIC_LIGHTHOUSE_API_KEY."
    );
  }

  const boundary = `----zkdapp-survey-${Date.now().toString(16)}`;
  const response = await fetch(LIGHTHOUSE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${IPFS_API_KEY}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: buildMultipartTextBody({
      fieldName: "file",
      fileName,
      contentType: "application/json",
      text: stableStringify(document),
      boundary,
    }),
  });

  if (!response.ok) {
    let message = `Lighthouse upload failed (${response.status}).`;
    try {
      const payload = await response.json();
      message = payload?.error || payload?.message || message;
    } catch {
      const text = await response.text();
      message = text || message;
    }

    throw new Error(`Lighthouse/IPFS metadata upload failed: ${message}`);
  }

  const payload = await response.json();
  const cid = payload?.Hash || payload?.hash || payload?.cid;

  if (!cid || typeof cid !== "string") {
    throw new Error("Lighthouse upload did not return a CID.");
  }

  return normalizeIpfsUri(cid);
};

export const fetchElectionMetadataDocument = async (
  metadataURI: string
): Promise<ElectionMetadataDocument> => {
  const response = await fetch(resolveIpfsGatewayUrl(metadataURI));

  if (!response.ok) {
    throw new Error(`Unable to fetch metadata from IPFS (${response.status}).`);
  }

  const document = await response.json();

  if (
    !document ||
    document.version !== 1 ||
    !document.metadata ||
    !document.eligibility ||
    !Array.isArray(document.metadata.questions) ||
    !Array.isArray(document.eligibility.requirements)
  ) {
    throw new Error("Invalid election metadata document.");
  }

  return document as ElectionMetadataDocument;
};
