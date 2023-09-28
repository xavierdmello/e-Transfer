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

export function toFixedIfNecessary( value: string, dp: number ){
  return +parseFloat(value).toFixed( dp );
}

export function numberWithCommas(x: string) {
  var parts = x.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}