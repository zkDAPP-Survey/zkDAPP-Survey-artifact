import type { OnDeviceProofResult } from "./moproProver";
import { EligibilityCircuitInput } from "@/utils/sdjwt/eligibilityInput";

export type { OnDeviceProofResult };

// mopro and react-native-fs are native-only; on web set EXPO_PUBLIC_ZK_PROVER=service.
export async function generateEligibilityProofOnDevice(_input: EligibilityCircuitInput): Promise<OnDeviceProofResult> {
  throw new Error("On-device proving is not available on web. Set EXPO_PUBLIC_ZK_PROVER=service.");
}
