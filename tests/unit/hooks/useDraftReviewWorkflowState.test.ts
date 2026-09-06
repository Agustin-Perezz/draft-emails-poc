import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDraftReviewWorkflowState } from "@/app/draft-review/hooks/useDraftReviewWorkflowState";
import { WorkflowStatus } from "@/lib/types";

beforeEach(() => {
  vi.resetModules();
});

describe("useDraftReviewWorkflowState", () => {
  it("starts in Idle", () => {
    const { result } = renderHook(() => useDraftReviewWorkflowState());

    expect(result.current.status).toBe(WorkflowStatus.Idle);
  });

  it("follows the happy path: idle → drafting → reviewing → sending → done", () => {
    const { result } = renderHook(() => useDraftReviewWorkflowState());

    act(() => result.current.startDrafting());
    expect(result.current.status).toBe(WorkflowStatus.Drafting);

    act(() => result.current.startReviewing());
    expect(result.current.status).toBe(WorkflowStatus.Reviewing);

    act(() => result.current.startSending());
    expect(result.current.status).toBe(WorkflowStatus.Sending);

    act(() => result.current.markDone());
    expect(result.current.status).toBe(WorkflowStatus.Done);
  });

  it("reports an error with a message from any workflow state", () => {
    const { result } = renderHook(() => useDraftReviewWorkflowState());

    act(() => result.current.startDrafting());
    act(() => result.current.reportError("LLM timeout"));

    expect(result.current.status).toBe(WorkflowStatus.Error);
    expect(result.current.errorMessage).toBe("LLM timeout");
  });

  it("ignores invalid transitions", () => {
    const { result } = renderHook(() => useDraftReviewWorkflowState());

    // Cannot send or finish before a draft exists and is reviewed.
    act(() => result.current.startSending());
    expect(result.current.status).toBe(WorkflowStatus.Idle);

    act(() => result.current.markDone());
    expect(result.current.status).toBe(WorkflowStatus.Idle);
  });

  it("resets to idle and clears the error when starting a new draft", () => {
    const { result } = renderHook(() => useDraftReviewWorkflowState());

    act(() => result.current.startDrafting());
    act(() => result.current.reportError("LLM timeout"));
    act(() => result.current.startDrafting());

    expect(result.current.status).toBe(WorkflowStatus.Drafting);
    expect(result.current.errorMessage).toBeNull();
  });
});
