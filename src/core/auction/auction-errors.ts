import type { PlaceBidFailure, PlaceBidFailureCode } from "./auction-types";

export function bidFailure(
  code: PlaceBidFailureCode,
  message: string,
): PlaceBidFailure {
  return {
    ok: false,
    code,
    message,
  };
}