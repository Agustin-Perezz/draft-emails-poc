"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type DraftReviewJobPostInputProps = {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isDrafting: boolean;
};

export function DraftReviewJobPostInput({
  value,
  onChange,
  onGenerate,
  isDrafting,
}: DraftReviewJobPostInputProps) {
  return (
    <section className="flex flex-col gap-3">
      <label htmlFor="job-post" className="text-sm font-medium">
        Paste the raw job post
      </label>
      <Textarea
        id="job-post"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste the full job post text here…"
        rows={8}
        disabled={isDrafting}
      />
      <Button
        type="button"
        onClick={onGenerate}
        disabled={isDrafting || value.trim().length === 0}
      >
        {isDrafting ? "Generating…" : "Generate Draft"}
      </Button>
    </section>
  );
}
