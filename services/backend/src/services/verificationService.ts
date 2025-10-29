import { VerificationResult } from "../types/verification.js";

const misinformationKeywords = ["hoax", "rumour", "fake", "debunked"];
const reputableKeywords = ["official", "government", "research", "report"];

export function verifySubmission(text: string): VerificationResult {
  const normalized = text.toLowerCase();

  const containsMisinformation = misinformationKeywords.some((keyword) =>
    normalized.includes(keyword)
  );

  const containsReputable = reputableKeywords.some((keyword) =>
    normalized.includes(keyword)
  );

  if (containsMisinformation && !containsReputable) {
    return {
      verdict: "fake",
      explanation:
        "The submission includes language often associated with debunked claims. Recommend verifying with trusted sources.",
      reputationScore: 25,
      bias: "unknown"
    };
  }

  if (containsReputable && !containsMisinformation) {
    return {
      verdict: "true",
      explanation:
        "The submission contains references to reputable sources. Still encourage cross-checking before sharing widely.",
      reputationScore: 78,
      bias: "center"
    };
  }

  return {
    verdict: "uncertain",
    explanation:
      "No strong signals detected. Encourage the user to corroborate this story with trusted outlets before accepting it.",
    reputationScore: 50,
    bias: "unknown"
  };
}
