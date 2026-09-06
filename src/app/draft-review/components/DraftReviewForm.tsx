"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DraftPayload } from "@/lib/types";

const draftFormSchema = z.object({
  to: z.email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

type DraftFormValues = z.infer<typeof draftFormSchema>;

type DraftReviewFormProps = {
  draft: DraftPayload;
  isSending: boolean;
  onApproveAndSend: (edited: DraftFormValues) => void;
};

export function DraftReviewForm({
  draft,
  isSending,
  onApproveAndSend,
}: DraftReviewFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: { to: draft.to, subject: draft.subject, body: draft.body },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onApproveAndSend)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="draft-to">To</Label>
        <Input
          id="draft-to"
          type="email"
          {...register("to")}
          aria-invalid={Boolean(errors.to)}
        />
        {errors.to ? (
          <p className="text-sm text-destructive">{errors.to.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="draft-subject">Subject</Label>
        <Input
          id="draft-subject"
          {...register("subject")}
          aria-invalid={Boolean(errors.subject)}
        />
        {errors.subject ? (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="draft-body">Body</Label>
        <Textarea
          id="draft-body"
          rows={12}
          {...register("body")}
          aria-invalid={Boolean(errors.body)}
        />
        {errors.body ? (
          <p className="text-sm text-destructive">{errors.body.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Attachments</span>
        {draft.attachments.map((attachment) => (
          <span
            key={attachment.filename}
            className="text-sm text-muted-foreground"
          >
            {attachment.filename}
          </span>
        ))}
      </div>
      <Button type="submit" disabled={isSending}>
        {isSending ? "Sending…" : "Approve & Send"}
      </Button>
    </form>
  );
}
