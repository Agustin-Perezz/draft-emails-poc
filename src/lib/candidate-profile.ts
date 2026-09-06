import type { CandidateProfile } from "@/lib/types";

export const CANDIDATE_PROFILE: CandidateProfile = {
  name: "Agustin Perez",
  title: "Full-Stack Engineer",
  yearsOfExperience: "3+",
  coreStack: [
    "React",
    "Next.js",
    "Nest.js",
    "TypeScript",
    "Node.js",
    "AWS",
    "Clean architecture and Clean code",
  ],
  portfolioUrl: "https://portfolio-two-alpha-cvs8791gjg.vercel.app",
  githubUrl: "https://github.com/Agustin-Perezz",
};

export const STYLE_GUIDELINES = `Tone: modern, concise and professional. No filler phrases.
Structure: a short intro paragraph, 2-3 bullet points matching the candidate's stack to the job requirements, and a direct call to action.
Banned greetings: never use archaic openings such as "De mi mayor consideración" or "Quien suscribe".
Language: REPLY IN THE SAME LANGUAGE AS THE JOB POST (Spanish post -> Spanish email, English post -> English email).`;

export function buildSystemPrompt(): string {
  const profileLines = [
    `You write job outreach emails on behalf of the following candidate.`,
    `Name: ${CANDIDATE_PROFILE.name}`,
    `Title: ${CANDIDATE_PROFILE.title}`,
    `Years of experience: ${CANDIDATE_PROFILE.yearsOfExperience}`,
    `Core stack: ${CANDIDATE_PROFILE.coreStack.join(", ")}`,
    `Portfolio: ${CANDIDATE_PROFILE.portfolioUrl}`,
    `GitHub: ${CANDIDATE_PROFILE.githubUrl}`,
    "",
    STYLE_GUIDELINES,
  ];

  return profileLines.join("\n");
}
