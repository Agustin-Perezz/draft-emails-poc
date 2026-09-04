import { describe, expect, it } from "vitest";

import {
  buildSystemPrompt,
  CANDIDATE_PROFILE,
  STYLE_GUIDELINES,
} from "@/lib/candidate-profile";
import { CV_PLACEHOLDER_URL } from "@/lib/constants";
import type { CandidateProfile } from "@/lib/types";

describe("CANDIDATE_PROFILE", () => {
  it("matches the CandidateProfile type with the placeholder CV URL", () => {
    // Type conformance is enforced by the CandidateProfile annotation at the
    // declaration site; here we assert the values that matter downstream.
    const profile: CandidateProfile = CANDIDATE_PROFILE;
    expect(profile.cvUrl).toBe(CV_PLACEHOLDER_URL);
    expect(profile.name).toBe("Agustin Perez");
    expect(profile.coreStack.length).toBeGreaterThan(0);
  });
});

describe("STYLE_GUIDELINES", () => {
  it("contains the language-matching and banned-greetings rules", () => {
    expect(STYLE_GUIDELINES).toMatch(/same language/i);
    expect(STYLE_GUIDELINES).toContain("De mi mayor consideración");
  });
});

describe("buildSystemPrompt", () => {
  it("includes profile fields and style guidelines", () => {
    const requiredSnippets = [
      CANDIDATE_PROFILE.name,
      CANDIDATE_PROFILE.title,
      CANDIDATE_PROFILE.yearsOfExperience,
      ...CANDIDATE_PROFILE.coreStack,
      CANDIDATE_PROFILE.portfolioUrl,
      CANDIDATE_PROFILE.githubUrl,
      CANDIDATE_PROFILE.cvUrl,
      STYLE_GUIDELINES,
    ];

    const systemPrompt = buildSystemPrompt();

    for (const snippet of requiredSnippets) {
      expect(systemPrompt).toContain(snippet);
    }
  });
});
