import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

export function hashEmail(email: string): `0x${string}` {
  return keccak256(encodeAbiParameters(parseAbiParameters("string"), [email]));
}

export function isCastable(bigint: string): boolean {
  try {
    BigInt(bigint);
    return true;
  } catch (err) {
    return false;
  }
}
