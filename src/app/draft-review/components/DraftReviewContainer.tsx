"use client";

import { useCallback, useState } from "react";

import { API_ROUTES } from "@/lib/constants";
import type {
  DraftApiRequest,
  DraftApiResponse,
  SendApiRequest,
  SendApiResponse,
} from "@/lib/types";
import { useDraftReviewWorkflowState } from "../hooks/useDraftReviewWorkflowState";
import { DraftReviewForm } from "./DraftReviewForm";
import { DraftReviewJobPostInput } from "./DraftReviewJobPostInput";

type ApiErrorEnvelope = {
  error: { message: string };
};

async function postJson<RequestBody extends object, ResponseBody>(
  url: string,
  body: RequestBody,
): Promise<ResponseBody> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json()) as ApiErrorEnvelope;
    throw new Error(
      payload.error?.message ?? `Request failed (${response.status}).`,
    );
  }

  return (await response.json()) as ResponseBody;
}

export function DraftReviewContainer() {
  const workflow = useDraftReviewWorkflowState();
  const [rawPost, setRawPost] = useState("");
  const [draft, setDraft] = useState<DraftApiResponse | null>(null);
  const isDrafting = workflow.status === "drafting";
  const isSending = workflow.status === "sending";

  const generateDraft = useCallback(async () => {
    workflow.startDrafting();
    try {
      const payload = await postJson<DraftApiRequest, DraftApiResponse>(
        API_ROUTES.DRAFT,
        {
          rawPost,
        },
      );
      setDraft(payload);
      workflow.startReviewing();
    } catch (error) {
      workflow.reportError(
        error instanceof Error ? error.message : "Unexpected error.",
      );
    }
  }, [rawPost, workflow]);

  const approveAndSend = useCallback(
    async (edited: { to: string; subject: string; body: string }) => {
      if (!draft) {
        return;
      }

      workflow.startSending();
      try {
        const request: SendApiRequest = {
          draft: { ...draft.draft, ...edited },
          approvalToken: draft.approvalToken,
        };
        const response = await postJson<SendApiRequest, SendApiResponse>(
          API_ROUTES.SEND,
          request,
        );
        workflow.markDone();
        return response;
      } catch (error) {
        workflow.reportError(
          error instanceof Error ? error.message : "Unexpected error.",
        );
      }
    },
    [draft, workflow],
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Draft Emails Outreach</h1>

      {workflow.status === "error" || workflow.errorMessage ? (
        <p
          role="alert"
          data-testid="workflow-error"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {workflow.errorMessage}
        </p>
      ) : null}

      <DraftReviewJobPostInput
        value={rawPost}
        onChange={setRawPost}
        onGenerate={generateDraft}
        isDrafting={isDrafting}
      />

      {workflow.status === "reviewing" && draft ? (
        <DraftReviewForm
          draft={draft.draft}
          isSending={isSending}
          onApproveAndSend={approveAndSend}
        />
      ) : null}

      {workflow.status === "done" ? (
        <p className="text-sm text-muted-foreground" data-testid="send-success">
          Email sent successfully.
        </p>
      ) : null}
    </div>
  );
}
