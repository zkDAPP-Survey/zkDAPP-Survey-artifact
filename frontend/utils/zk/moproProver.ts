import { generateCircomProofTimed, ProofLib } from "mopro-ffi";
import RNFS from "react-native-fs";

import { Groth16ProofCalldata } from "@/types/election";
import { EligibilityCircuitInput } from "@/utils/sdjwt/eligibilityInput";

// Static imports on purpose: in development, a dynamic import() fetches its chunk from Metro on first use, and
// doing that right after returning from Valera (when Android has dropped the app's Metro connection in the
// background) makes React Native reload the whole app. Web uses moproProver.web.ts instead.

// On-device Groth16 proving with mopro (native Rust, arkworks) for circuit v4.
// The native prover selects the witness calculator by the zkey file name, so the asset name must stay
// "eligibility_v4.zkey". A new name per circuit version also
// keeps devices from reusing a zkey cached by an older app build.
const ZKEY_FILE_NAME = "eligibility_v4.zkey";

export type OnDeviceProofResult = {
  calldata: Groth16ProofCalldata;
  /** Witness calculation, measured in native code */
  witnessMs: number;
  /** Groth16 proving incl. reading the zkey, measured in native code */
  provingMs: number;
  /** Wall-clock time of the whole call as seen from JS */
  totalMs: number;
};

async function getZkeyPath(): Promise<string> {
  const destPath = `${RNFS.DocumentDirectoryPath}/${ZKEY_FILE_NAME}`;
  if (!(await RNFS.exists(destPath))) {
    // assets/keys is linked into android/app/src/main/assets/custom by `npm run assets`
    await RNFS.copyFileAssets(`custom/${ZKEY_FILE_NAME}`, destPath);
  }
  return destPath;
}

/** mopro expects every signal as an array of decimal strings. */
function toMoproInputs(input: EligibilityCircuitInput): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(input).map(([name, value]) => [name, Array.isArray(value) ? value.map(String) : [String(value)]]),
  );
}

/** Same layout as snarkjs `exportSolidityCallData`: G2 coordinates are passed as (c1, c0). */
function toCalldata(proof: { a: { x: string; y: string }; b: { x: string[]; y: string[] }; c: { x: string; y: string } }, inputs: string[]): Groth16ProofCalldata {
  return {
    pi_a: [proof.a.x, proof.a.y],
    pi_b: [
      [proof.b.x[1], proof.b.x[0]],
      [proof.b.y[1], proof.b.y[0]],
    ],
    pi_c: [proof.c.x, proof.c.y],
    pubInputs: inputs,
  };
}

export async function generateEligibilityProofOnDevice(input: EligibilityCircuitInput): Promise<OnDeviceProofResult> {
  const zkeyPath = await getZkeyPath();
  const circuitInputs = JSON.stringify(toMoproInputs(input));

  const startedAt = performance.now();
  // Async export: proving runs on a native thread, so the UI stays responsive
  const timed = await generateCircomProofTimed(zkeyPath, circuitInputs, ProofLib.Arkworks);
  const totalMs = performance.now() - startedAt;

  return {
    calldata: toCalldata(timed.proofResult.proof, timed.proofResult.inputs),
    witnessMs: Number(timed.witnessMs),
    provingMs: Number(timed.provingMs),
    totalMs,
  };
}
