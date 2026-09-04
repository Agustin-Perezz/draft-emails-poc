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
    expect(CANDIDATE_PROFILE).toEqual({
      name: "Agustin Perez",
      title: "Frontend Developer",
      yearsOfExperience: expect.any(String),
      coreStack: expect.any(Array),
      portfolioUrl: expect.any(String),
      githubUrl: expect.any(String),
      cvUrl: CV_PLACEHOLDER_URL,
    } satisfies CandidateProfile);
  });
});

describe("STYLE_GUIDELINES", () => {
  it("contains the language-matching rule", () => {
    expect(STYLE_GUIDELINES).toMatch(/same language/i);
  });

  it("contains the banned-greetings rule", () => {
    expect(STYLE_GUIDELINES).toContain("De mi mayor consideración");
  });
});

describe("buildSystemPrompt", () => {
  it("includes profile fields and style guidelines", () => {
    const systemPrompt = buildSystemPrompt();

    expect(systemPrompt).toContain(CANDIDATE_PROFILE.name);
    expect(systemPrompt).toContain(CANDIDATE_PROFILE.title);
    expect(systemPrompt).toContain(CANDIDATE_PROFILE.yearsOfExperience);
    for (const technology of CANDIDATE_PROFILE.coreStack) {
      expect(systemPrompt).toContain(technology);
    }
    expect(systemPrompt).toContain(CANDIDATE_PROFILE.portfolioUrl);
    expect(systemPrompt).toContain(CANDIDATE_PROFILE.githubUrl);
    expect(systemPrompt).toContain(CANDIDATE_PROFILE.cvUrl);
    expect(systemPrompt).toContain(STYLE_GUIDELINES);
  });
});
