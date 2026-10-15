import { keccak256 } from "@ethersproject/keccak256";

import { extractNumericValue } from "@/utils/requirementAttributeMap";
import { parseValueForCircuit } from "@/utils/sdjwt/eligibilityInput";
import { getResidencePermitCountryByLabel } from "@/utils/zk/residencePermitLocations";

// Turns survey requirements into the circuit's requirement public inputs.
// Survey creation hashes these into the contract's eligibilityHash and registration proves against them,
// so both sides must derive them with this module.

type RequirementLike = { type: string; value: string };

export type EligibilityRules = {
  minAge: string;
  enableAgeCheck: string;
  requiredCountry: string;
  allowedRegions: [string, string, string, string, string];
  allowedDistricts: [string, string, string, string, string];
  enableCountryCheck: string;
  enableRegionCheck: string;
  enableDistrictCheck: string;
};

export function resolveAgeRequirement(requirements: RequirementLike[]) {
  const ageRequirement = requirements.find((requirement) => requirement.type === "Age");
  if (!ageRequirement) {
    return { enableAgeCheck: "0", minAge: "0" };
  }

  const minAge = extractNumericValue(ageRequirement.value);
  if (minAge == null) {
    throw new Error(`Could not extract an age value from "${ageRequirement.value}".`);
  }

  return { enableAgeCheck: "1", minAge: String(minAge) };
}

function padToFive(encoded: string[]): [string, string, string, string, string] {
  const padded = encoded.slice(0, 5);
  while (padded.length < 5) padded.push("0");
  return padded as [string, string, string, string, string];
}

function normalizeRequirementTypeKey(type: string): string {
  return String(type ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseLocationParts(value: string): { country: string; region: string; district: string } {
  const [country = "", region = "", district = ""] = String(value ?? "")
    .split(/\s*\/\s*/)
    .map((part) => part.trim());

  return { country, region, district };
}

function parseMultiValue(value: string): string[] {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function encodeCountryForCircuit(countryLabelOrCode: string): string {
  const countryValue = countryLabelOrCode.trim();
  const code = getResidencePermitCountryByLabel(countryValue)?.code ?? countryValue;
  return parseValueForCircuit(code);
}

export function resolveLocationRequirementInputs(requirements: RequirementLike[]) {
  let requiredCountry = "0";
  let enableCountryCheck = "0";
  let allowedRegions: [string, string, string, string, string] = ["0", "0", "0", "0", "0"];
  let enableRegionCheck = "0";
  let allowedDistricts: [string, string, string, string, string] = ["0", "0", "0", "0", "0"];
  let enableDistrictCheck = "0";

  for (const requirement of requirements) {
    const typeKey = normalizeRequirementTypeKey(requirement.type);
    const location = parseLocationParts(requirement.value);

    if ((typeKey === "country" || typeKey === "location") && location.country) {
      requiredCountry = encodeCountryForCircuit(location.country);
      enableCountryCheck = "1";
    }

    const regionValue = location.region || (typeKey === "region" ? location.country : "");
    if ((typeKey === "region" || typeKey === "location") && regionValue) {
      const regionNames = parseMultiValue(regionValue);
      if (regionNames.length > 0) {
        allowedRegions = padToFive(regionNames.map(parseValueForCircuit));
        enableRegionCheck = "1";
      }
    }

    const districtValue = location.district || (typeKey === "district" ? location.country : "");
    if ((typeKey === "district" || typeKey === "location") && districtValue) {
      const districtNames = parseMultiValue(districtValue);
      if (districtNames.length > 0) {
        allowedDistricts = padToFive(districtNames.map(parseValueForCircuit));
        enableDistrictCheck = "1";
      }
    }
  }

  return {
    requiredCountry,
    allowedRegions,
    allowedDistricts,
    enableCountryCheck,
    enableRegionCheck,
    enableDistrictCheck,
  };
}


export function resolveEligibilityRules(requirements: RequirementLike[]): EligibilityRules {
  return { ...resolveAgeRequirement(requirements), ...resolveLocationRequirementInputs(requirements) };
}

/** Public signals [4..19] of the circuit, in order: minAge, requiredCountry, allowedRegions, allowedDistricts, flags. */
export function toRuleSignals(rules: EligibilityRules): string[] {
  return [
    rules.minAge,
    rules.requiredCountry,
    ...rules.allowedRegions,
    ...rules.allowedDistricts,
    rules.enableAgeCheck,
    rules.enableCountryCheck,
    rules.enableRegionCheck,
    rules.enableDistrictCheck,
  ];
}

/** Matches SurveyManager `keccak256(abi.encodePacked(uint256[16] rules))`. */
export function computeEligibilityHash(rules: EligibilityRules): string {
  const words = toRuleSignals(rules).map((value) => BigInt(value).toString(16).padStart(64, "0"));
  return keccak256(`0x${words.join("")}`);
}
