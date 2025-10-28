export type CredibilityVerdict = "true" | "fake" | "uncertain";

export interface VerificationResult {
  verdict: CredibilityVerdict;
  explanation: string;
  reputationScore: number;
  bias: "left" | "center" | "right" | "unknown";
}
