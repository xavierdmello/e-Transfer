import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

export function hashEmail(email: string): `0x${string}` {
  return keccak256(encodeAbiParameters(parseAbiParameters("string"), [email]));
}